from datetime import datetime, date, time
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models import (
    Bed, Admission, Patient, Appointment, Doctor, Employee,
    Consultation, Disease, Diagnosis, Prescription, PrescriptionItem,
    Medicine, PharmacyInventory, Billing, Payment, Room, Ward, Department,
    PharmacyBill, PharmacyBillItem, PharmacyPayment
)
from app.schemas import (
    AdmissionCreate, AdmissionDischarge, AppointmentCreate,
    ConsultationCreate, PaymentCreate, RestockRequest,
    DoctorCreate, MedicineCreate, PharmacyBillCreate
)

class AdmissionService:
    @staticmethod
    def admit_patient(data: AdmissionCreate, db: Session) -> Admission:
        """
        ATOMIC TRANSACTION with PESSIMISTIC LOCKING:
        Prevents race condition where two clerks attempt to assign the same bed.
        """
        try:
            # 1. Verify patient exists
            patient = db.query(Patient).filter(Patient.patient_id == data.patient_id).first()
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")

            # 2. Check if patient is already actively admitted
            active_adm = db.query(Admission).filter(
                Admission.patient_id == data.patient_id,
                Admission.status == 'Admitted'
            ).first()
            if active_adm:
                raise HTTPException(status_code=400, detail=f"Patient is already admitted (Admission ID: {active_adm.admission_id})")

            # 3. PESSIMISTIC ROW LOCK on Bed (SELECT ... FOR UPDATE)
            bed = db.query(Bed).filter(Bed.bed_id == data.bed_id).with_for_update().first()
            if not bed:
                raise HTTPException(status_code=404, detail="Bed not found")
            if bed.status != 'Available':
                raise HTTPException(status_code=409, detail=f"Bed {bed.bed_number} is currently {bed.status}. Cannot assign.")

            # 4. Atomic state mutation
            bed.status = 'Occupied'
            admission = Admission(
                patient_id=data.patient_id,
                bed_id=data.bed_id,
                admit_date=data.admit_date or datetime.now(),
                status='Admitted'
            )
            db.add(admission)
            db.flush() # populate admission.admission_id

            # 5. Create initial inpatient billing ledger
            billing = Billing(
                patient_id=data.patient_id,
                admission_id=admission.admission_id,
                consultation_fee=Decimal('0.00'),
                bed_charges=Decimal('1500.00'), # Initial 1-day base charge
                pharmacy_charges=Decimal('0.00'),
                other_charges=Decimal('500.00'), # Admission registration fee
                payment_status='Pending'
            )
            db.add(billing)

            db.commit()
            db.refresh(admission)
            return admission

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Admission transaction aborted: {str(e)}")

    @staticmethod
    def discharge_patient(admission_id: int, data: AdmissionDischarge, db: Session) -> Admission:
        """
        ATOMIC TRANSACTION: Discharges patient and immediately releases the bed.
        """
        try:
            # 1. Lock admission row
            admission = db.query(Admission).filter(Admission.admission_id == admission_id).with_for_update().first()
            if not admission:
                raise HTTPException(status_code=404, detail="Admission record not found")
            if admission.status == 'Discharged':
                raise HTTPException(status_code=400, detail="Patient has already been discharged")

            # 2. Lock bed row and release
            bed = db.query(Bed).filter(Bed.bed_id == admission.bed_id).with_for_update().first()
            if bed:
                bed.status = 'Available'

            # 3. Update admission details
            discharge_time = datetime.now()
            admission.discharge_date = discharge_time
            admission.status = 'Discharged'
            admission.discharge_summary = data.discharge_summary

            # 4. Finalize bed days and update billing
            days = max(1, (discharge_time - admission.admit_date).days)
            daily_rate = Decimal('1500.00')
            total_bed_charges = Decimal(days) * daily_rate

            billing = db.query(Billing).filter(Billing.admission_id == admission.admission_id).first()
            if billing:
                billing.bed_charges = total_bed_charges

            db.commit()
            db.refresh(admission)
            return admission

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Discharge transaction aborted: {str(e)}")


class AppointmentService:
    @staticmethod
    def book_appointment(data: AppointmentCreate, db: Session) -> Appointment:
        """
        ATOMIC CONCURRENCY CHECK:
        Prevents double booking doctor at same date and time slot.
        """
        try:
            # 1. Verify doctor exists and get details
            doctor = db.query(Doctor).join(Employee).filter(Doctor.doctor_id == data.doctor_id).first()
            if not doctor:
                raise HTTPException(status_code=404, detail="Doctor not found")

            # 2. Verify patient exists
            patient = db.query(Patient).filter(Patient.patient_id == data.patient_id).first()
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")

            # 3. Double-Booking Conflict Check (DB Unique constraint acts as backstop)
            existing_conflict = db.query(Appointment).filter(
                Appointment.doctor_id == data.doctor_id,
                Appointment.appointment_date == data.appointment_date,
                Appointment.appointment_time == data.appointment_time,
                Appointment.status.in_(['Scheduled'])
            ).first()

            if existing_conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Doctor is already booked on {data.appointment_date} at {data.appointment_time}."
                )

            # 4. Insert appointment record
            appointment = Appointment(
                patient_id=data.patient_id,
                doctor_id=data.doctor_id,
                appointment_date=data.appointment_date,
                appointment_time=data.appointment_time,
                reason_for_visit=data.reason_for_visit,
                status='Scheduled'
            )
            db.add(appointment)
            db.flush()

            # 5. Create billing invoice for doctor consultation fee
            billing = Billing(
                patient_id=data.patient_id,
                appointment_id=appointment.appointment_id,
                consultation_fee=doctor.consultation_fee,
                bed_charges=Decimal('0.00'),
                pharmacy_charges=Decimal('0.00'),
                other_charges=Decimal('50.00'), # OPD slip charge
                payment_status='Pending'
            )
            db.add(billing)

            db.commit()
            db.refresh(appointment)
            return appointment

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Booking transaction failed: {str(e)}")


class ClinicalService:
    @staticmethod
    def record_consultation(data: ConsultationCreate, db: Session) -> Consultation:
        """
        MULTI-TABLE ATOMIC TRANSACTION:
        1. Creates Consultation (3NF: doctor derived via appointment)
        2. Sets Appointment to 'Completed'
        3. Inserts Diagnoses mapped to Disease_Master
        4. Inserts Prescription & Prescription Items with Surrogate PK
        5. Atomically deducts Pharmacy Inventory
        6. Updates Pharmacy charges in Billing
        """
        try:
            # 1. Verify appointment
            appt = db.query(Appointment).filter(Appointment.appointment_id == data.appointment_id).first()
            if not appt:
                raise HTTPException(status_code=404, detail="Appointment not found")

            existing_consult = db.query(Consultation).filter(Consultation.appointment_id == data.appointment_id).first()
            if existing_consult:
                raise HTTPException(status_code=400, detail="Consultation already recorded for this appointment")

            # 2. Mark appointment completed
            appt.status = 'Completed'

            # 3. Create Consultation record
            consultation = Consultation(
                appointment_id=data.appointment_id,
                symptoms=data.symptoms,
                clinical_notes=data.clinical_notes,
                consultation_date=datetime.now()
            )
            db.add(consultation)
            db.flush()

            # 4. Insert Diagnoses
            for diag in data.diagnoses:
                # verify ICD code exists
                dis = db.query(Disease).filter(Disease.icd_code == diag.icd_code).first()
                if not dis:
                    raise HTTPException(status_code=404, detail=f"Invalid ICD code: {diag.icd_code}")
                db_diag = Diagnosis(
                    consultation_id=consultation.consultation_id,
                    icd_code=diag.icd_code,
                    severity=diag.severity,
                    remarks=diag.remarks
                )
                db.add(db_diag)

            # 5. Insert Prescription if prescribed (pure clinical order, no premature stock deduction)
            if data.prescriptions:
                rx = Prescription(
                    consultation_id=consultation.consultation_id,
                    instructions="Administer as prescribed"
                )
                db.add(rx)
                db.flush()

                for item in data.prescriptions:
                    med = db.query(Medicine).filter(Medicine.medicine_id == item.medicine_id).first()
                    if not med:
                        raise HTTPException(status_code=404, detail=f"Medicine ID {item.medicine_id} not found")

                    rx_item = PrescriptionItem(
                        prescription_id=rx.prescription_id,
                        medicine_id=item.medicine_id,
                        dosage=item.dosage,
                        frequency=item.frequency,
                        duration=item.duration,
                        instructions=item.instructions
                    )
                    db.add(rx_item)

            db.commit()
            db.refresh(consultation)
            return consultation

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Consultation transaction failed: {str(e)}")


class PharmacyService:
    @staticmethod
    def restock(medicine_id: int, data: RestockRequest, db: Session) -> PharmacyInventory:
        """
        Atomic stock update with lock.
        """
        try:
            inv = db.query(PharmacyInventory).filter(
                PharmacyInventory.medicine_id == medicine_id
            ).with_for_update().first()

            if not inv:
                raise HTTPException(status_code=404, detail="Medicine inventory record not found")

            inv.quantity_in_stock += data.quantity
            inv.last_restocked = datetime.now()
            db.commit()
            db.refresh(inv)
            return inv
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


class BillingService:
    @staticmethod
    def process_payment(data: PaymentCreate, db: Session) -> Payment:
        """
        AUDITED TRANSACTION:
        Locks billing record, adds payment, recalculates payment_status.
        """
        try:
            bill = db.query(Billing).filter(Billing.billing_id == data.billing_id).with_for_update().first()
            if not bill:
                raise HTTPException(status_code=404, detail="Billing record not found")

            payment = Payment(
                billing_id=data.billing_id,
                amount_paid=Decimal(str(data.amount_paid)),
                payment_method=data.payment_method,
                transaction_status='Success',
                reference_number=data.reference_number or f"TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            )
            db.add(payment)
            db.flush()

            # Sum total paid so far
            total_paid = db.query(func.coalesce(func.sum(Payment.amount_paid), 0)).filter(
                Payment.billing_id == data.billing_id,
                Payment.transaction_status == 'Success'
            ).scalar()

            if total_paid >= bill.total_amount:
                bill.payment_status = 'Paid'
            elif total_paid > 0:
                bill.payment_status = 'Partially_Paid'

            db.commit()
            db.refresh(payment)
            return payment
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Payment transaction failed: {str(e)}")


class PharmacyBillingService:
    @staticmethod
    def create_bill(data: PharmacyBillCreate, db: Session) -> PharmacyBill:
        """
        ATOMIC PHARMACY DISPENSING & BILLING TRANSACTION:
        1. Verifies patient & prescribing doctor
        2. Acquires exclusive row locks on required medicines
        3. Verifies stock availability >= prescribed quantity
        4. Deducts exact dispensed quantities from inventory
        5. Computes line totals & subtotal
        6. Creates PharmacyBill & PharmacyBillItem records
        7. Records immediate payment if paid
        """
        try:
            # 1. Verify patient
            patient = db.query(Patient).filter(Patient.patient_id == data.patient_id).first()
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")

            if not data.items:
                raise HTTPException(status_code=400, detail="Cannot generate bill with 0 items")

            # 2. Check stock and deduct for all items atomically
            subtotal = Decimal('0.00')
            bill_items_to_add = []

            for item_in in data.items:
                med = db.query(Medicine).filter(Medicine.medicine_id == item_in.medicine_id).first()
                if not med:
                    raise HTTPException(status_code=404, detail=f"Medicine ID {item_in.medicine_id} not found")

                # Lock inventory row
                inv = db.query(PharmacyInventory).filter(
                    PharmacyInventory.medicine_id == item_in.medicine_id
                ).with_for_update().first()

                if not inv:
                    raise HTTPException(status_code=404, detail=f"Inventory record missing for {med.name}")

                if inv.quantity_in_stock < item_in.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient stock for {med.name}. Requested: {item_in.quantity}, Available in stock: {inv.quantity_in_stock}"
                    )

                # Deduct inventory stock
                inv.quantity_in_stock -= item_in.quantity

                unit_price = Decimal(str(med.unit_price))
                line_total = unit_price * Decimal(item_in.quantity)
                subtotal += line_total

                bill_items_to_add.append({
                    "medicine_id": item_in.medicine_id,
                    "quantity": item_in.quantity,
                    "unit_price": unit_price,
                    "total_price": line_total
                })

            # Calculate total (5% GST healthcare pharmaceutical tax)
            tax = round(subtotal * Decimal('0.05'), 2)
            total = subtotal + tax

            payment_status = 'Paid' if (data.amount_paid and data.amount_paid >= float(total)) else 'Pending'

            # 3. Create Pharmacy Bill
            pbill = PharmacyBill(
                patient_id=data.patient_id,
                doctor_id=data.doctor_id,
                prescription_id=data.prescription_id,
                subtotal=subtotal,
                tax_amount=tax,
                total_amount=total,
                payment_status=payment_status,
                bill_date=datetime.now()
            )
            db.add(pbill)
            db.flush()

            # 4. Insert items
            for b_item in bill_items_to_add:
                row = PharmacyBillItem(
                    pharmacy_bill_id=pbill.pharmacy_bill_id,
                    medicine_id=b_item["medicine_id"],
                    quantity=b_item["quantity"],
                    unit_price=b_item["unit_price"],
                    total_price=b_item["total_price"]
                )
                db.add(row)

            # 5. Insert payment if paid
            if payment_status == 'Paid':
                pmt = PharmacyPayment(
                    pharmacy_bill_id=pbill.pharmacy_bill_id,
                    payment_time=datetime.now(),
                    amount_paid=total,
                    payment_method=data.payment_method or 'Cash',
                    reference_number=data.reference_number or f"PHARM-TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                )
                db.add(pmt)

            db.commit()
            db.refresh(pbill)
            return pbill

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Pharmacy billing transaction aborted: {str(e)}")

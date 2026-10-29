-- =============================================================================
-- Hospital Management System - Normalized 3NF Database Schema
-- DBMS Course Project
-- Database Engine: MySQL 8.0+ / 9.0+ (InnoDB Engine with ACID Compliance)
-- =============================================================================

DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

-- -----------------------------------------------------------------------------
-- 1. Postal Code Master (3NF Address Decomposition)
-- Functional Dependency: pincode -> city, state
-- -----------------------------------------------------------------------------
CREATE TABLE pincodes (
    pincode VARCHAR(10) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    INDEX idx_city (city),
    INDEX idx_state (state)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. Hospital Master
-- -----------------------------------------------------------------------------
CREATE TABLE hospitals (
    hospital_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_no VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    establishment_year INT NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hospital_pincode FOREIGN KEY (pincode) REFERENCES pincodes(pincode) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. Departments
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    contact_no VARCHAR(20) NOT NULL,
    CONSTRAINT fk_dept_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    INDEX idx_dept_name (name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. Wards
-- -----------------------------------------------------------------------------
CREATE TABLE wards (
    ward_id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- General, ICU, Pediatric, Maternity, Cardiac
    location VARCHAR(100) NOT NULL,
    CONSTRAINT fk_ward_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. Rooms
-- -----------------------------------------------------------------------------
CREATE TABLE rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    floor INT NOT NULL,
    room_type VARCHAR(50) NOT NULL, -- Single, Double, Deluxe, ICU Suite
    status ENUM('Available', 'Occupied', 'Maintenance', 'Cleaning') DEFAULT 'Available',
    CONSTRAINT fk_room_ward FOREIGN KEY (ward_id) REFERENCES wards(ward_id) ON DELETE CASCADE,
    UNIQUE KEY uq_ward_room (ward_id, room_number)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. Beds
-- -----------------------------------------------------------------------------
CREATE TABLE beds (
    bed_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    bed_number VARCHAR(20) NOT NULL,
    bed_type VARCHAR(50) NOT NULL, -- Standard, Electric ICU, Pediatric, Semi-Fowler
    status ENUM('Available', 'Occupied', 'Maintenance', 'Reserved') DEFAULT 'Available',
    CONSTRAINT fk_bed_room FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    UNIQUE KEY uq_room_bed (room_id, bed_number),
    INDEX idx_bed_status (status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. Employees (Base Table for ISA Hierarchy)
-- Common fields: joining_date, qualification, shift
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    joining_date DATE NOT NULL,
    qualification VARCHAR(120) NOT NULL,
    shift ENUM('Morning', 'Evening', 'Night', 'Rotational') NOT NULL DEFAULT 'Morning',
    role ENUM('Doctor', 'Nurse', 'Receptionist', 'Staff') NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_employee_dept FOREIGN KEY (department_id) REFERENCES departments(department_id) ON UPDATE CASCADE,
    CONSTRAINT fk_employee_pincode FOREIGN KEY (pincode) REFERENCES pincodes(pincode) ON UPDATE CASCADE,
    INDEX idx_emp_dept (department_id),
    INDEX idx_emp_role (role)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 8. Subclass Table: Doctors (Class Table Inheritance)
-- -----------------------------------------------------------------------------
CREATE TABLE doctors (
    doctor_id INT PRIMARY KEY,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    specialisation VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    CONSTRAINT fk_doctor_employee FOREIGN KEY (doctor_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    INDEX idx_doctor_spec (specialisation)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 9. Subclass Table: Nurses (Class Table Inheritance)
-- -----------------------------------------------------------------------------
CREATE TABLE nurses (
    nurse_id INT PRIMARY KEY,
    nursing_council_reg_no VARCHAR(50) NOT NULL UNIQUE,
    assigned_ward_id INT NULL,
    CONSTRAINT fk_nurse_employee FOREIGN KEY (nurse_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    CONSTRAINT fk_nurse_ward FOREIGN KEY (assigned_ward_id) REFERENCES wards(ward_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 10. Subclass Table: Receptionists (Class Table Inheritance)
-- -----------------------------------------------------------------------------
CREATE TABLE receptionists (
    receptionist_id INT PRIMARY KEY,
    desk_number VARCHAR(20) NOT NULL,
    CONSTRAINT fk_receptionist_employee FOREIGN KEY (receptionist_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 11. Patients
-- -----------------------------------------------------------------------------
CREATE TABLE patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    aadhaar_no VARCHAR(16) NOT NULL UNIQUE,
    dob DATE NOT NULL,
    email VARCHAR(120) NULL,
    phone VARCHAR(20) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_pincode FOREIGN KEY (pincode) REFERENCES pincodes(pincode) ON UPDATE CASCADE,
    INDEX idx_patient_name (name),
    INDEX idx_patient_phone (phone)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 12. Emergency Contacts
-- -----------------------------------------------------------------------------
CREATE TABLE emergency_contacts (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    CONSTRAINT fk_contact_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 13. Allergies
-- -----------------------------------------------------------------------------
CREATE TABLE allergies (
    allergy_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    allergen VARCHAR(100) NOT NULL,
    reaction VARCHAR(255) NOT NULL,
    severity ENUM('Mild', 'Moderate', 'Severe', 'Life-Threatening') NOT NULL,
    CONSTRAINT fk_allergy_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 14. Admissions (Inpatient Management)
-- -----------------------------------------------------------------------------
CREATE TABLE admissions (
    admission_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    bed_id INT NOT NULL,
    admit_date DATETIME NOT NULL,
    discharge_date DATETIME NULL,
    status ENUM('Admitted', 'Discharged', 'Transferred') DEFAULT 'Admitted',
    discharge_summary TEXT NULL,
    CONSTRAINT fk_admission_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_admission_bed FOREIGN KEY (bed_id) REFERENCES beds(bed_id) ON UPDATE CASCADE,
    INDEX idx_admission_status (status),
    INDEX idx_admission_dates (admit_date, discharge_date)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 15. Appointments
-- Constraint: No double-booking for the same doctor at the same slot
-- -----------------------------------------------------------------------------
CREATE TABLE appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason_for_visit VARCHAR(255) NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'No-Show') DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
    UNIQUE KEY uq_doctor_slot (doctor_id, appointment_date, appointment_time),
    INDEX idx_appt_date (appointment_date),
    INDEX idx_appt_status (status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 16. Consultations (3NF Cleaned: doctor_id & diagnosis_summary removed)
-- Attending doctor is resolved via Appointment -> Doctor
-- Diagnoses are resolved via 1:M Diagnoses table
-- -----------------------------------------------------------------------------
CREATE TABLE consultations (
    consultation_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    symptoms TEXT NOT NULL,
    clinical_notes TEXT NULL,
    consultation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consult_appt FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 17. Disease Master (3NF: Eliminates transitive dependency ICDCode -> DiseaseName)
-- -----------------------------------------------------------------------------
CREATE TABLE diseases (
    icd_code VARCHAR(20) PRIMARY KEY,
    disease_name VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT NULL,
    INDEX idx_disease_name (disease_name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 18. Diagnoses (Referencing Disease Master)
-- -----------------------------------------------------------------------------
CREATE TABLE diagnoses (
    diagnosis_id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT NOT NULL,
    icd_code VARCHAR(20) NOT NULL,
    severity ENUM('Mild', 'Moderate', 'Severe', 'Critical') NOT NULL,
    remarks VARCHAR(255) NULL,
    CONSTRAINT fk_diag_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE,
    CONSTRAINT fk_diag_disease FOREIGN KEY (icd_code) REFERENCES diseases(icd_code) ON UPDATE CASCADE,
    INDEX idx_diag_icd (icd_code)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 19. Medicines Master
-- -----------------------------------------------------------------------------
CREATE TABLE medicines (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    strength VARCHAR(50) NOT NULL, -- e.g., "500 mg", "10 ml", "200 mcg"
    form ENUM('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Inhaler') NOT NULL DEFAULT 'Tablet',
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    manufacturer VARCHAR(120) NOT NULL,
    UNIQUE KEY uq_medicine_strength (name, strength)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 20. Pharmacy Inventory Table
-- -----------------------------------------------------------------------------
CREATE TABLE pharmacy_inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL UNIQUE,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 20,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    last_restocked DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE CASCADE,
    INDEX idx_low_stock (quantity_in_stock, reorder_level)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 21. Prescriptions
-- -----------------------------------------------------------------------------
CREATE TABLE prescriptions (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT NOT NULL,
    issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    instructions TEXT NULL,
    CONSTRAINT fk_rx_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(consultation_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 22. Prescription Items (With Surrogate PK prescription_item_id)
-- -----------------------------------------------------------------------------
CREATE TABLE prescription_items (
    prescription_item_id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    medicine_id INT NOT NULL,
    dosage VARCHAR(50) NOT NULL,     -- e.g. "1 tablet"
    frequency VARCHAR(50) NOT NULL,  -- e.g. "Twice a day after food"
    duration VARCHAR(50) NOT NULL,   -- e.g. "5 days"
    instructions VARCHAR(255) NULL,
    CONSTRAINT fk_item_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE RESTRICT,
    UNIQUE KEY uq_rx_med (prescription_id, medicine_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 23. Billings (Invoicing for Appointments / Admissions)
-- -----------------------------------------------------------------------------
CREATE TABLE billings (
    billing_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    appointment_id INT NULL,
    admission_id INT NULL,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    bed_charges DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    pharmacy_charges DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    other_charges DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (
        consultation_fee + bed_charges + pharmacy_charges + other_charges
    ) STORED,
    payment_status ENUM('Pending', 'Partially_Paid', 'Paid', 'Refunded') DEFAULT 'Pending',
    billing_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bill_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_bill_appt FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    CONSTRAINT fk_bill_admission FOREIGN KEY (admission_id) REFERENCES admissions(admission_id) ON DELETE SET NULL,
    INDEX idx_bill_status (payment_status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 24. Payments (Financial Transactions with Concurrency Audit)
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    billing_id INT NOT NULL,
    payment_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash', 'UPI', 'Credit Card', 'Debit Card', 'Insurance', 'Net Banking') NOT NULL,
    transaction_status ENUM('Success', 'Failed', 'Pending', 'Reversed') DEFAULT 'Success',
    reference_number VARCHAR(100) NULL,
    CONSTRAINT fk_payment_billing FOREIGN KEY (billing_id) REFERENCES billings(billing_id) ON DELETE CASCADE,
    INDEX idx_payment_time (payment_time),
    INDEX idx_trans_status (transaction_status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 25. Pharmacy Bills (Dedicated Dispensary Billing)
-- -----------------------------------------------------------------------------
CREATE TABLE pharmacy_bills (
    pharmacy_bill_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NULL,
    prescription_id INT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('Pending', 'Partially_Paid', 'Paid') DEFAULT 'Paid',
    bill_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pbill_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_pbill_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    CONSTRAINT fk_pbill_rx FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE SET NULL,
    INDEX idx_pbill_date (bill_date),
    INDEX idx_pbill_status (payment_status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 26. Pharmacy Bill Items (Line Items with Quantity & Price)
-- -----------------------------------------------------------------------------
CREATE TABLE pharmacy_bill_items (
    bill_item_id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_bill_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_pitem_bill FOREIGN KEY (pharmacy_bill_id) REFERENCES pharmacy_bills(pharmacy_bill_id) ON DELETE CASCADE,
    CONSTRAINT fk_pitem_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 27. Pharmacy Payments (Payments for Dispensary Orders)
-- -----------------------------------------------------------------------------
CREATE TABLE pharmacy_payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_bill_id INT NOT NULL,
    payment_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking') NOT NULL,
    reference_number VARCHAR(100) NULL,
    CONSTRAINT fk_ppay_bill FOREIGN KEY (pharmacy_bill_id) REFERENCES pharmacy_bills(pharmacy_bill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

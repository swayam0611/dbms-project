"""
Seed script to populate hospital_db with 25-35 realistic records per entity.
Ensures full relational integrity, realistic Indian names/addresses, and 3NF compliance.
"""

import sys
import random
from datetime import datetime, date, timedelta
import pymysql

def get_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="",
        database="hospital_db",
        charset="utf8mb4",
        autocommit=False,
        cursorclass=pymysql.cursors.DictCursor
    )

def seed_database():
    conn = get_connection()
    cursor = conn.cursor()
    print("Connected to MySQL. Starting seeding process...")

    try:
        # Disable foreign key checks for clean truncation if needed
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        for table in [
            "payments", "billings", "prescription_items", "prescriptions",
            "pharmacy_inventory", "medicines", "diagnoses", "diseases",
            "consultations", "appointments", "admissions", "allergies",
            "emergency_contacts", "patients", "receptionists", "nurses",
            "doctors", "employees", "beds", "rooms", "wards", "departments",
            "hospitals", "pincodes"
        ]:
            cursor.execute(f"TRUNCATE TABLE {table};")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        conn.commit()
        print("Existing tables truncated.")

        # ---------------------------------------------------------------------
        # 1. Pincodes (30 records: Indian cities & states)
        # ---------------------------------------------------------------------
        pincodes_data = [
            ("110001", "New Delhi", "Delhi"),
            ("110016", "South Delhi", "Delhi"),
            ("400001", "Mumbai", "Maharashtra"),
            ("400050", "Bandra Mumbai", "Maharashtra"),
            ("411001", "Pune", "Maharashtra"),
            ("411038", "Kothrud Pune", "Maharashtra"),
            ("560001", "Bengaluru", "Karnataka"),
            ("560034", "Koramangala Bengaluru", "Karnataka"),
            ("560100", "Electronic City Bengaluru", "Karnataka"),
            ("600001", "Chennai", "Tamil Nadu"),
            ("600028", "Adyar Chennai", "Tamil Nadu"),
            ("500001", "Hyderabad", "Telangana"),
            ("500081", "Hitec City Hyderabad", "Telangana"),
            ("700001", "Kolkata", "West Bengal"),
            ("700091", "Salt Lake Kolkata", "West Bengal"),
            ("380001", "Ahmedabad", "Gujarat"),
            ("380015", "Vastrapur Ahmedabad", "Gujarat"),
            ("302001", "Jaipur", "Rajasthan"),
            ("302017", "Malviya Nagar Jaipur", "Rajasthan"),
            ("226001", "Lucknow", "Uttar Pradesh"),
            ("226010", "Gomti Nagar Lucknow", "Uttar Pradesh"),
            ("201301", "Noida", "Uttar Pradesh"),
            ("122001", "Gurugram", "Haryana"),
            ("160017", "Chandigarh", "Chandigarh"),
            ("682001", "Kochi", "Kerala"),
            ("695001", "Thiruvananthapuram", "Kerala"),
            ("462001", "Bhopal", "Madhya Pradesh"),
            ("452001", "Indore", "Madhya Pradesh"),
            ("800001", "Patna", "Bihar"),
            ("751001", "Bhubaneswar", "Odisha")
        ]
        cursor.executemany(
            "INSERT INTO pincodes (pincode, city, state) VALUES (%s, %s, %s);",
            pincodes_data
        )
        print(f"Inserted {len(pincodes_data)} pincodes.")

        # ---------------------------------------------------------------------
        # 2. Hospitals (3 records)
        # ---------------------------------------------------------------------
        hospitals_data = [
            ("Apex Multi-Speciality Institute", "022-26549001", "contact@apexhospital.org", 1998, "Plot 14, S.V. Road, Bandra West", "400050"),
            ("Metro Life Healthcare Center", "011-41527800", "info@metrolife.org", 2005, "Sector 44, Institutional Area", "122001"),
            ("Sahyadri Valley Health & Research", "020-25448000", "helpdesk@sahyadrivalley.org", 2012, "Paud Road, Kothrud", "411038")
        ]
        cursor.executemany(
            """INSERT INTO hospitals (name, contact_no, email, establishment_year, street_address, pincode)
               VALUES (%s, %s, %s, %s, %s, %s);""",
            hospitals_data
        )
        print(f"Inserted {len(hospitals_data)} hospitals.")

        # ---------------------------------------------------------------------
        # 3. Departments (20 records)
        # ---------------------------------------------------------------------
        depts_info = [
            (1, "Cardiology", "Block A, 3rd Floor", "022-26549101"),
            (1, "Neurology & Neurosurgery", "Block A, 4th Floor", "022-26549102"),
            (1, "Orthopedics & Joint Replacement", "Block B, 1st Floor", "022-26549103"),
            (1, "Pediatrics & Neonatology", "Block C, 2nd Floor", "022-26549104"),
            (1, "General Internal Medicine", "Block B, Ground Floor", "022-26549105"),
            (1, "General & Laparoscopic Surgery", "Block B, 3rd Floor", "022-26549106"),
            (1, "Dermatology & Cosmetology", "Block D, 1st Floor", "022-26549107"),
            (1, "Ophthalmology", "Block D, 2nd Floor", "022-26549108"),
            (1, "Otorhinolaryngology (ENT)", "Block D, 3rd Floor", "022-26549109"),
            (1, "Obstetrics & Gynecology", "Block C, 1st Floor", "022-26549110"),
            (1, "Nephrology & Dialysis", "Block A, 2nd Floor", "022-26549111"),
            (1, "Medical & Surgical Oncology", "Block E, 4th Floor", "022-26549112"),
            (1, "Pulmonology & Chest Medicine", "Block A, 1st Floor", "022-26549113"),
            (1, "Gastroenterology & Hepatology", "Block B, 2nd Floor", "022-26549114"),
            (1, "Psychiatry & Clinical Psychology", "Block E, 1st Floor", "022-26549115"),
            (1, "Emergency & Trauma Care", "Block E, Ground Floor", "022-26549999"),
            (1, "Radiology & Imaging Sciences", "Basement Block A", "022-26549116"),
            (1, "Pathology & Lab Medicine", "Basement Block B", "022-26549117"),
            (1, "Anesthesiology & Critical Care", "OT Complex Block A", "022-26549118"),
            (1, "Physiotherapy & Rehabilitation", "Block E, 2nd Floor", "022-26549119")
        ]
        cursor.executemany(
            "INSERT INTO departments (hospital_id, name, location, contact_no) VALUES (%s, %s, %s, %s);",
            depts_info
        )
        print(f"Inserted {len(depts_info)} departments.")

        # ---------------------------------------------------------------------
        # 4. Wards (20 records)
        # ---------------------------------------------------------------------
        wards_data = [
            (1, "Cardiac Care Ward (CCW)", "Cardiac", "Block A, Wing 1"),
            (1, "Intensive Coronary Unit (ICCU)", "ICU", "Block A, Wing 2"),
            (1, "Neuro Intensive Care Unit (NICU)", "ICU", "Block A, Wing 3"),
            (1, "Surgical ICU (SICU)", "ICU", "Block B, Wing 1"),
            (1, "Medical ICU (MICU)", "ICU", "Block B, Wing 2"),
            (1, "Pediatric ICU (PICU)", "ICU", "Block C, Wing 1"),
            (1, "Neonatal ICU (NICU-Neo)", "ICU", "Block C, Wing 2"),
            (1, "General Male Ward A", "General", "Block B, 2nd Floor"),
            (1, "General Male Ward B", "General", "Block B, 2nd Floor"),
            (1, "General Female Ward A", "General", "Block B, 3rd Floor"),
            (1, "General Female Ward B", "General", "Block B, 3rd Floor"),
            (1, "Pediatric General Ward", "Pediatric", "Block C, 3rd Floor"),
            (1, "Maternity & Postnatal Ward", "Maternity", "Block C, 1st Floor"),
            (1, "Orthopedic Post-Op Ward", "General", "Block B, 1st Floor"),
            (1, "Oncology Daycare Ward", "Daycare", "Block E, 3rd Floor"),
            (1, "Dialysis Daycare Ward", "Daycare", "Block A, 2nd Floor"),
            (1, "Executive Deluxe Ward East", "Deluxe", "Block D, 4th Floor"),
            (1, "Executive Deluxe Ward West", "Deluxe", "Block D, 4th Floor"),
            (1, "Isolation / Infection Ward", "Isolation", "Block E, 5th Floor"),
            (1, "Emergency Triage Ward", "Emergency", "Block E, Ground Floor")
        ]
        cursor.executemany(
            "INSERT INTO wards (hospital_id, name, type, location) VALUES (%s, %s, %s, %s);",
            wards_data
        )
        print(f"Inserted {len(wards_data)} wards.")

        # ---------------------------------------------------------------------
        # 5. Rooms (30 records across wards)
        # ---------------------------------------------------------------------
        rooms_data = []
        for ward_id in range(1, 21):
            floor = (ward_id % 4) + 1
            room_type = "Deluxe" if ward_id in [17, 18] else ("ICU Suite" if "ICU" in wards_data[ward_id-1][1] else "General")
            rooms_data.append((ward_id, f"R-{ward_id}01", floor, room_type, "Available"))
            if ward_id <= 10:
                rooms_data.append((ward_id, f"R-{ward_id}02", floor, room_type, "Available"))
        cursor.executemany(
            "INSERT INTO rooms (ward_id, room_number, floor, room_type, status) VALUES (%s, %s, %s, %s, %s);",
            rooms_data
        )
        print(f"Inserted {len(rooms_data)} rooms.")

        # ---------------------------------------------------------------------
        # 6. Beds (40 records)
        # ---------------------------------------------------------------------
        beds_data = []
        bed_count = 0
        for room_id in range(1, len(rooms_data) + 1):
            beds_data.append((room_id, f"B-{room_id}-01", "Standard Hospital Bed", "Available"))
            bed_count += 1
            if room_id <= 10:
                beds_data.append((room_id, f"B-{room_id}-02", "Electric ICU Bed", "Available"))
                bed_count += 1
        cursor.executemany(
            "INSERT INTO beds (room_id, bed_number, bed_type, status) VALUES (%s, %s, %s, %s);",
            beds_data
        )
        print(f"Inserted {len(beds_data)} beds.")

        # ---------------------------------------------------------------------
        # 7. Employees (35 records: Doctors, Nurses, Receptionists)
        # ---------------------------------------------------------------------
        # Base attributes: employee_id, department_id, name, email, phone, salary, dob, gender,
        # joining_date, qualification, shift, role, street_address, pincode
        emp_records = [
            # 20 Doctors
            (1, "Dr. Rajesh K. Sharma", "r.sharma@apexhospital.org", "9820112345", 220000.00, "1975-04-12", "Male", "2010-06-15", "MD, DM (Cardiology), FACC", "Morning", "Doctor", "12 Mayfair Apts, Bandra", "400050"),
            (1, "Dr. Priya Nair", "p.nair@apexhospital.org", "9820223456", 195000.00, "1982-08-23", "Female", "2015-02-01", "MD (Medicine), DM (Cardiology)", "Morning", "Doctor", "45 Sea Green, Worli", "400001"),
            (2, "Dr. Aniruddh Deshmukh", "a.deshmukh@apexhospital.org", "9820334567", 250000.00, "1972-11-05", "Male", "2008-09-10", "MCh (Neurosurgery), AIIMS", "Morning", "Doctor", "8 Model Colony, Pune", "411001"),
            (2, "Dr. Sunita Rao", "s.rao@apexhospital.org", "9820445678", 180000.00, "1985-03-18", "Female", "2017-07-15", "MD, DM (Neurology)", "Morning", "Doctor", "72 Palm Groves, Kothrud", "411038"),
            (3, "Dr. Vikramaditya Rathore", "v.rathore@apexhospital.org", "9820556789", 210000.00, "1978-01-30", "Male", "2012-04-01", "MS (Orthopedics), MCh (Ortho UK)", "Morning", "Doctor", "14 Regency Park, Malviya Nagar", "302017"),
            (3, "Dr. Aditi Mukherjee", "a.mukherjee@apexhospital.org", "9820667890", 175000.00, "1986-09-14", "Female", "2018-01-10", "MS (Orthopedics), DNB", "Morning", "Doctor", "29 Lake View, Salt Lake", "700091"),
            (4, "Dr. Manish Gupta", "m.gupta@apexhospital.org", "9820778901", 160000.00, "1983-05-22", "Male", "2016-03-20", "MD (Pediatrics), FIAP", "Morning", "Doctor", "55 Defence Colony", "110016"),
            (4, "Dr. Shalini Kulkarni", "s.kulkarni@apexhospital.org", "9820889012", 155000.00, "1988-12-08", "Female", "2019-06-01", "MD (Pediatrics), DNB (Neonatology)", "Morning", "Doctor", "102 Hill Crest, Kothrud", "411038"),
            (5, "Dr. Arvind Swaminathan", "a.swami@apexhospital.org", "9820990123", 150000.00, "1980-07-19", "Male", "2014-11-15", "MD (General Medicine)", "Morning", "Doctor", "33 Anna Nagar", "600028"),
            (5, "Dr. Neha Bhasin", "n.bhasin@apexhospital.org", "9821001234", 145000.00, "1987-02-11", "Female", "2019-08-20", "MD (Internal Medicine)", "Morning", "Doctor", "67 Golf Links", "110001"),
            (6, "Dr. Sanjay Verma", "s.verma@apexhospital.org", "9821112345", 200000.00, "1976-10-03", "Male", "2011-05-12", "MS (General Surgery), FMAS", "Morning", "Doctor", "88 Cyber City", "122001"),
            (7, "Dr. Ritu Chawla", "r.chawla@apexhospital.org", "9821223456", 140000.00, "1984-06-27", "Female", "2017-09-01", "MD (Dermatology, Venereology)", "Morning", "Doctor", "19 Green Park", "110016"),
            (8, "Dr. Harish Iyer", "h.iyer@apexhospital.org", "9821334567", 165000.00, "1981-03-05", "Male", "2015-10-15", "MS (Ophthalmology), FICO", "Morning", "Doctor", "51 Besant Nagar", "600028"),
            (9, "Dr. Meenakshi Sundaram", "m.sundaram@apexhospital.org", "9821445678", 160000.00, "1983-09-17", "Female", "2016-12-01", "MS (ENT), DLO", "Morning", "Doctor", "22 Gandhi Road", "600001"),
            (10, "Dr. Kavita Singhal", "k.singhal@apexhospital.org", "9821556789", 190000.00, "1979-08-14", "Female", "2013-04-18", "MD (Obstetrics & Gynae), FICOG", "Morning", "Doctor", "40 Gomti Nagar", "226010"),
            (11, "Dr. Alok Pandey", "a.pandey@apexhospital.org", "9821667890", 215000.00, "1977-01-25", "Male", "2012-08-05", "MD, DM (Nephrology)", "Morning", "Doctor", "78 Hazratganj", "226001"),
            (12, "Dr. Devendra Soni", "d.soni@apexhospital.org", "9821778901", 240000.00, "1974-12-30", "Male", "2010-01-15", "MD (Radiotherapy), DM (Oncology)", "Morning", "Doctor", "15 Vastrapur", "380015"),
            (13, "Dr. Farhan Qureshi", "f.qureshi@apexhospital.org", "9821889012", 170000.00, "1985-04-09", "Male", "2018-05-10", "MD (Pulmonary Medicine)", "Morning", "Doctor", "93 Jubilee Hills", "500001"),
            (14, "Dr. Tanvi Parekh", "t.parekh@apexhospital.org", "9821990123", 185000.00, "1982-11-20", "Female", "2016-01-20", "MD, DM (Gastroenterology)", "Morning", "Doctor", "36 Navrangpura", "380001"),
            (15, "Dr. Kedar Joshi", "k.joshi@apexhospital.org", "9822001234", 150000.00, "1986-07-04", "Male", "2019-10-01", "MD (Psychiatry), DPM", "Morning", "Doctor", "11 Deccan Gymkhana", "411001"),

            # 10 Nurses
            (1, "Sister Mary Joseph", "m.joseph@apexhospital.org", "9830111222", 65000.00, "1988-03-12", "Female", "2016-04-01", "B.Sc Nursing, Critical Care Cert", "Rotational", "Nurse", "14 St. Jude Colony", "400050"),
            (2, "Sister Anjali Patil", "a.patil@apexhospital.org", "9830222333", 58000.00, "1992-06-25", "Female", "2018-08-15", "GNM, Post-Basic B.Sc Nursing", "Morning", "Nurse", "25 Shivaji Nagar", "411001"),
            (3, "Sister Deepa Nair", "d.nair@apexhospital.org", "9830333444", 62000.00, "1990-10-18", "Female", "2017-02-10", "B.Sc Nursing", "Evening", "Nurse", "67 Kalyan West", "400001"),
            (4, "Nurse Suresh Babu", "s.babu@apexhospital.org", "9830444555", 55000.00, "1993-01-30", "Male", "2019-11-01", "B.Sc Nursing", "Night", "Nurse", "88 Chembur Colony", "400050"),
            (5, "Sister Rekha Sharma", "r.sharma.nurse@apexhospital.org", "9830555666", 60000.00, "1991-09-05", "Female", "2017-05-20", "GNM, OT Nursing Cert", "Morning", "Nurse", "12 Andheri East", "400050"),
            (6, "Sister Sarita Yadav", "s.yadav@apexhospital.org", "9830666777", 52000.00, "1995-12-14", "Female", "2021-03-01", "B.Sc Nursing", "Rotational", "Nurse", "45 Thane West", "400001"),
            (7, "Nurse Jitin Thomas", "j.thomas@apexhospital.org", "9830777888", 59000.00, "1992-04-22", "Male", "2018-09-15", "B.Sc Nursing, Pediatric Cert", "Night", "Nurse", "33 Vashi", "400001"),
            (8, "Sister Lakshmi Pillai", "l.pillai@apexhospital.org", "9830888999", 64000.00, "1989-08-19", "Female", "2016-07-01", "M.Sc Nursing (Obstetrics)", "Morning", "Nurse", "79 Nerul", "400001"),
            (11, "Sister Pooja Tiwari", "p.tiwari@apexhospital.org", "9830999000", 54000.00, "1994-02-28", "Female", "2020-01-10", "B.Sc Nursing (Dialysis)", "Rotational", "Nurse", "21 Dadar West", "400050"),
            (16, "Nurse Ashwin George", "a.george@apexhospital.org", "9831000111", 63000.00, "1991-11-11", "Male", "2017-10-05", "B.Sc Nursing, Trauma Care", "Rotational", "Nurse", "56 Mahim", "400050"),

            # 5 Receptionists
            (16, "Kunal Bhatia", "k.bhatia@apexhospital.org", "9840111222", 42000.00, "1996-05-14", "Male", "2021-06-01", "B.Com, Hospital Administration Diploma", "Morning", "Receptionist", "18 Borivali West", "400001"),
            (16, "Sneha Sen", "s.sen@apexhospital.org", "9840222333", 40000.00, "1998-09-20", "Female", "2022-02-15", "BBA (Healthcare Management)", "Evening", "Receptionist", "32 Goregaon East", "400050"),
            (16, "Rohan Jadhav", "r.jadhav@apexhospital.org", "9840333444", 38000.00, "1999-01-10", "Male", "2023-01-10", "B.A, Front Office Management Cert", "Night", "Receptionist", "74 Sion West", "400001"),
            (16, "Pooja Hegde", "p.hegde@apexhospital.org", "9840444555", 41000.00, "1997-07-28", "Female", "2021-11-01", "B.Sc, Customer Relations Diploma", "Morning", "Receptionist", "105 Vile Parle", "400050"),
            (16, "Amitabh Saxena", "a.saxena@apexhospital.org", "9840555666", 45000.00, "1994-04-16", "Male", "2020-04-01", "MBA (Hospital Administration)", "Rotational", "Receptionist", "62 Mulund West", "400001")
        ]
        cursor.executemany(
            """INSERT INTO employees (department_id, name, email, phone, salary, dob, gender,
                                      joining_date, qualification, shift, role, street_address, pincode)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);""",
            emp_records
        )
        print(f"Inserted {len(emp_records)} employees.")

        # ---------------------------------------------------------------------
        # 8. Subclass Doctors (20 records, IDs 1 to 20)
        # ---------------------------------------------------------------------
        doctors_data = [
            (1, "MCI-CARD-10291", "Cardiology", 16, 1200.00),
            (2, "MCI-CARD-15822", "Interventional Cardiology", 11, 1000.00),
            (3, "MCI-NEUR-08173", "Neurosurgery", 18, 1500.00),
            (4, "MCI-NEUR-19284", "Clinical Neurology", 9, 1100.00),
            (5, "MCI-ORTH-11925", "Orthopedic Surgery", 14, 1000.00),
            (6, "MCI-ORTH-20186", "Joint Replacement", 8, 900.00),
            (7, "MCI-PEDI-14737", "Pediatrics", 10, 800.00),
            (8, "MCI-NEO-22018", "Neonatology", 7, 850.00),
            (9, "MCI-MED-12949", "Internal Medicine", 12, 700.00),
            (10, "MCI-MED-21030", "Internal Medicine", 7, 650.00),
            (11, "MCI-SURG-09181", "General & Laparoscopic Surgery", 15, 1100.00),
            (12, "MCI-DERM-18272", "Dermatology", 9, 800.00),
            (13, "MCI-OPHT-13923", "Ophthalmology", 11, 750.00),
            (14, "MCI-ENT-16284", "ENT & Head-Neck Surgery", 10, 750.00),
            (15, "MCI-GYN-11095", "Obstetrics & Gynecology", 13, 900.00),
            (16, "MCI-NEPH-09286", "Nephrology", 14, 1200.00),
            (17, "MCI-ONCO-07187", "Medical Oncology", 16, 1500.00),
            (18, "MCI-PULM-19288", "Pulmonology", 8, 850.00),
            (19, "MCI-GAST-15289", "Gastroenterology", 10, 1100.00),
            (20, "MCI-PSYC-21930", "Psychiatry", 7, 900.00)
        ]
        cursor.executemany(
            """INSERT INTO doctors (doctor_id, license_number, specialisation, experience_years, consultation_fee)
               VALUES (%s, %s, %s, %s, %s);""",
            doctors_data
        )
        print(f"Inserted {len(doctors_data)} doctors.")

        # ---------------------------------------------------------------------
        # 9. Subclass Nurses (10 records, IDs 21 to 30)
        # ---------------------------------------------------------------------
        nurses_data = [
            (21, "MNC-RN-48191", 1),
            (22, "MNC-RN-59282", 2),
            (23, "MNC-RN-60193", 3),
            (24, "MNC-RN-71284", 4),
            (25, "MNC-RN-82915", 5),
            (26, "MNC-RN-93026", 8),
            (27, "MNC-RN-10297", 12),
            (28, "MNC-RN-21398", 13),
            (29, "MNC-RN-32409", 16),
            (30, "MNC-RN-43510", 20)
        ]
        cursor.executemany(
            "INSERT INTO nurses (nurse_id, nursing_council_reg_no, assigned_ward_id) VALUES (%s, %s, %s);",
            nurses_data
        )
        print(f"Inserted {len(nurses_data)} nurses.")

        # ---------------------------------------------------------------------
        # 10. Subclass Receptionists (5 records, IDs 31 to 35)
        # ---------------------------------------------------------------------
        recept_data = [
            (31, "DESK-A1-MAIN"),
            (32, "DESK-A2-OPD"),
            (33, "DESK-B1-EMERGENCY"),
            (34, "DESK-C1-BILLING"),
            (35, "DESK-D1-INQUIRY")
        ]
        cursor.executemany(
            "INSERT INTO receptionists (receptionist_id, desk_number) VALUES (%s, %s);",
            recept_data
        )
        print(f"Inserted {len(recept_data)} receptionists.")

        # ---------------------------------------------------------------------
        # 11. Patients (35 records)
        # ---------------------------------------------------------------------
        patients_raw = [
            ("Aarav Mehta", "Male", "O+", "482910394851", "1990-05-14", "aarav.m@gmail.com", "9819001122", "14 Green Heights, Bandra", "400050"),
            ("Diya Sen", "Female", "A+", "591029485721", "1994-08-22", "diya.sen@yahoo.com", "9819002233", "88 Park Circus, Salt Lake", "700091"),
            ("Rohan Kulkarni", "Male", "B+", "682910485920", "1982-11-09", "rohan.k@outlook.com", "9819003344", "45 Karve Road, Kothrud", "411038"),
            ("Ananya Verma", "Female", "AB+", "771920394851", "1997-03-31", "ananya.v@gmail.com", "9819004455", "102 Gomti Nagar Extension", "226010"),
            ("Kabir Bedi", "Male", "O-", "882910495812", "1978-07-15", "kabir.bedi@gmail.com", "9819005566", "19 Defence Colony", "110016"),
            ("Ishita Banerjee", "Female", "A-", "992019485723", "1985-01-20", "ishita.b@rediffmail.com", "9819006677", "33 Lake View, Salt Lake", "700091"),
            ("Aditya Nambiar", "Male", "B-", "102938475619", "1992-09-04", "aditya.n@gmail.com", "9819007788", "12 Marine Drive, Kochi", "682001"),
            ("Meera Nair", "Female", "O+", "213049586728", "1989-12-18", "meera.nair@hotmail.com", "9819008899", "64 Panampilly Nagar", "682001"),
            ("Vivaan Kapoor", "Male", "A+", "324150697839", "2015-06-11", "parents.vivaan@gmail.com", "9819009900", "5 Golf Links", "110001"),
            ("Sanya Malhotra", "Female", "B+", "435261708940", "1993-04-29", "sanya.m@gmail.com", "9819010011", "90 Malviya Nagar", "302017"),
            ("Devansh Agarwal", "Male", "AB-", "546372819051", "1980-02-14", "devansh.ag@gmail.com", "9819011122", "27 Vastrapur", "380015"),
            ("Tanvi Deshpande", "Female", "O+", "657483920162", "1986-10-08", "tanvi.d@gmail.com", "9819012233", "51 Model Colony", "411001"),
            ("Reyansh Pillai", "Male", "A+", "768594031273", "2018-03-25", "pillai.family@gmail.com", "9819013344", "82 Adyar Beach Road", "600028"),
            ("Kavya Subramaniam", "Female", "B+", "879605142384", "1991-07-02", "kavya.s@yahoo.co.in", "9819014455", "14 T. Nagar", "600001"),
            ("Arjun Singhania", "Male", "O+", "980716253495", "1972-09-17", "arjun.singhania@gmail.com", "9819015566", "11 Civil Lines, Lucknow", "226001"),
            ("Pari Choudhury", "Female", "A-", "191827364506", "2012-12-05", "choudhury.p@gmail.com", "9819016677", "94 Salt Lake Sector 2", "700091"),
            ("Shaurya Saxena", "Male", "B+", "282736451097", "1984-06-19", "shaurya.saxena@gmail.com", "9819017788", "38 Cyber City Road", "122001"),
            ("Aanya Joshi", "Female", "AB+", "373645102988", "1996-08-14", "aanya.j@gmail.com", "9819018899", "18 Deccan Gymkhana", "411001"),
            ("Dhruv Patel", "Male", "O+", "464510293879", "1988-04-23", "dhruv.p@gmail.com", "9819019900", "73 Navrangpura", "380001"),
            ("Riya Sen Sharma", "Female", "A+", "555410293860", "1995-10-30", "riya.sensharma@gmail.com", "9819020011", "29 Bandra Reclamation", "400050"),
            ("Mohit Chauhan", "Male", "B-", "646320194851", "1975-01-16", "mohit.c@gmail.com", "9819021122", "102 Malviya Nagar", "302017"),
            ("Isha Trivedi", "Female", "O-", "737230194842", "1999-05-27", "isha.t@gmail.com", "9819022233", "55 Vastrapur Lake", "380015"),
            ("Samar Sheikh", "Male", "A+", "828140194833", "1983-08-11", "samar.s@gmail.com", "9819023344", "41 Banjara Hills", "500001"),
            ("Tara Menon", "Female", "B+", "919050194824", "1987-11-24", "tara.m@gmail.com", "9819024455", "19 Panampilly", "682001"),
            ("Nakul Chadha", "Male", "AB+", "109860194815", "1991-03-08", "nakul.c@gmail.com", "9819025566", "72 Sector 14", "122001"),
            ("Navya Reddy", "Female", "O+", "208770194806", "1994-09-12", "navya.reddy@gmail.com", "9819026677", "84 Hitec City", "500081"),
            ("Pranav Hegde", "Male", "A-", "307680194797", "1979-12-01", "pranav.h@gmail.com", "9819027788", "61 Koramangala 4th Block", "560034"),
            ("Snehal Gaikwad", "Female", "B+", "406590194788", "1990-07-16", "snehal.g@gmail.com", "9819028899", "15 Kothrud Stand", "411038"),
            ("Farhan Akhtar", "Male", "O+", "505400194779", "1985-02-18", "farhan.a@gmail.com", "9819029900", "22 Bandra Carter Road", "400050"),
            ("Zoya Merchant", "Female", "A+", "604310194760", "1992-06-21", "zoya.m@gmail.com", "9819030011", "9 Colaba Causeway", "400001"),
            ("Harsh Vardhan", "Male", "B+", "703220194751", "1970-04-10", "harsh.v@gmail.com", "9819031122", "30 Gomti Nagar", "226010"),
            ("Anushka Rao", "Female", "AB-", "802130194742", "2000-01-28", "anushka.r@gmail.com", "9819032233", "14 Electronic City", "560100"),
            ("Madhavan Pillai", "Male", "O-", "901040194733", "1968-10-05", "madhavan.p@gmail.com", "9819033344", "48 Kowdiar", "695001"),
            ("Alia Bhattacharya", "Female", "A+", "190950194724", "1993-03-15", "alia.b@gmail.com", "9819034455", "37 Salt Lake Sector 5", "700091"),
            ("Siddharth Kapoor", "Male", "B+", "280860194715", "1981-11-20", "siddharth.k@gmail.com", "9819035566", "112 Vasant Kunj", "110016")
        ]
        cursor.executemany(
            """INSERT INTO patients (name, gender, blood_group, aadhaar_no, dob, email, phone, street_address, pincode)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);""",
            patients_raw
        )
        print(f"Inserted {len(patients_raw)} patients.")

        # ---------------------------------------------------------------------
        # 12. Emergency Contacts (35 records, 1 per patient)
        # ---------------------------------------------------------------------
        contacts_data = []
        relations = ["Spouse", "Father", "Mother", "Brother", "Sister", "Son", "Daughter"]
        for p_id in range(1, 36):
            rel = relations[p_id % len(relations)]
            c_name = f"Guardian of Patient #{p_id}"
            c_phone = f"9821{p_id:02d}9988"
            contacts_data.append((p_id, c_name, rel, c_phone))
        cursor.executemany(
            "INSERT INTO emergency_contacts (patient_id, name, relation, phone) VALUES (%s, %s, %s, %s);",
            contacts_data
        )
        print(f"Inserted {len(contacts_data)} emergency contacts.")

        # ---------------------------------------------------------------------
        # 13. Allergies (30 records)
        # ---------------------------------------------------------------------
        allergens = [
            ("Penicillin", "Skin hives, facial swelling", "Severe"),
            ("Sulfa Drugs", "Rash and itching", "Moderate"),
            ("Peanuts", "Anaphylaxis and breathlessness", "Life-Threatening"),
            ("Aspirin", "Bronchospasm, wheezing", "Severe"),
            ("Latex", "Contact dermatitis", "Mild"),
            ("Ibuprofen", "Gastric irritation and rash", "Moderate"),
            ("Shellfish", "Lip angioedema", "Life-Threatening"),
            ("Ciprofloxacin", "Nausea and hives", "Moderate"),
            ("Dust Mites", "Sneezing, rhinorrhea", "Mild"),
            ("Iodine Contrast", "Severe hypotension, rash", "Life-Threatening")
        ]
        allergies_data = []
        for i in range(1, 31):
            p_id = (i % 35) + 1
            item = allergens[i % len(allergens)]
            allergies_data.append((p_id, item[0], item[1], item[2]))
        cursor.executemany(
            "INSERT INTO allergies (patient_id, allergen, reaction, severity) VALUES (%s, %s, %s, %s);",
            allergies_data
        )
        print(f"Inserted {len(allergies_data)} allergies.")

        # ---------------------------------------------------------------------
        # 14. Admissions (25 records)
        # Some currently admitted, some discharged
        # ---------------------------------------------------------------------
        admissions_data = []
        now = datetime.now()
        for i in range(1, 26):
            patient_id = i
            bed_id = i
            admit_dt = now - timedelta(days=random.randint(3, 30), hours=random.randint(1, 10))
            if i <= 15:
                # Discharged
                disch_dt = admit_dt + timedelta(days=random.randint(2, 6))
                status = "Discharged"
                summary = "Patient recovered satisfactorily. Stable at discharge, follow-up after 10 days."
                bed_status = "Available"
            else:
                # Currently Admitted
                disch_dt = None
                status = "Admitted"
                summary = None
                bed_status = "Occupied"

            admissions_data.append((patient_id, bed_id, admit_dt, disch_dt, status, summary))
            cursor.execute("UPDATE beds SET status = %s WHERE bed_id = %s;", (bed_status, bed_id))

        cursor.executemany(
            """INSERT INTO admissions (patient_id, bed_id, admit_date, discharge_date, status, discharge_summary)
               VALUES (%s, %s, %s, %s, %s, %s);""",
            admissions_data
        )
        print(f"Inserted {len(admissions_data)} admissions and updated bed statuses.")

        # ---------------------------------------------------------------------
        # 15. Appointments (35 records)
        # Distributed across doctors, dates, times
        # ---------------------------------------------------------------------
        appointments_data = []
        reasons = [
            "Routine checkup and blood pressure monitoring",
            "Severe chest discomfort and breathlessness",
            "Persistent headache and occasional dizziness",
            "Knee joint pain during movement",
            "High fever, dry cough, and fatigue for 3 days",
            "Routine prenatal ultrasound and health check",
            "Skin rash, redness, and itching on arms",
            "Digestive issues, acid reflux, and stomach bloating",
            "Lower back pain radiating down left leg",
            "Follow-up consultation for diabetes management"
        ]
        times = ["09:00:00", "10:00:00", "11:30:00", "14:00:00", "15:30:00", "17:00:00"]
        base_date = date.today()

        for i in range(1, 36):
            p_id = i
            doc_id = (i % 20) + 1
            # distribute dates from 5 days ago to 5 days ahead
            offset = (i % 11) - 5
            appt_date = base_date + timedelta(days=offset)
            appt_time = times[(i * 2) % len(times)]
            reason = reasons[i % len(reasons)]

            if offset < 0:
                status = "Completed"
            elif offset == 0 and i % 3 == 0:
                status = "Cancelled"
            else:
                status = "Scheduled"

            appointments_data.append((p_id, doc_id, appt_date, appt_time, reason, status))

        cursor.executemany(
            """INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit, status)
               VALUES (%s, %s, %s, %s, %s, %s);""",
            appointments_data
        )
        print(f"Inserted {len(appointments_data)} appointments.")

        # ---------------------------------------------------------------------
        # 16. Diseases Master (30 records: ICD-10 Standards)
        # ---------------------------------------------------------------------
        diseases_data = [
            ("I10", "Essential (Primary) Hypertension", "Cardiovascular", "High blood pressure without identifiable secondary cause."),
            ("I21.9", "Acute Myocardial Infarction", "Cardiovascular", "Heart attack with ischemic myocardial necrosis."),
            ("I25.1", "Atherosclerotic Heart Disease", "Cardiovascular", "Coronary artery narrowing due to plaque."),
            ("I50.9", "Heart Failure, Unspecified", "Cardiovascular", "Inability of heart to pump adequate blood."),
            ("E11.9", "Type 2 Diabetes Mellitus", "Endocrine", "Adult-onset diabetes without acute complications."),
            ("E03.9", "Hypothyroidism, Unspecified", "Endocrine", "Underactive thyroid gland function."),
            ("J45.909", "Unspecified Asthma, Uncomplicated", "Respiratory", "Chronic airway inflammation and wheezing."),
            ("J06.9", "Acute Upper Respiratory Infection", "Respiratory", "Common cold and viral nasopharyngitis."),
            ("J18.9", "Pneumonia, Unspecified Organism", "Respiratory", "Infection causing lung alveolar inflammation."),
            ("J44.9", "Chronic Obstructive Pulmonary Disease", "Respiratory", "Progressive airflow limitation in lungs."),
            ("M54.5", "Low Back Pain (Lumbago)", "Musculoskeletal", "Musculoskeletal lower spinal discomfort."),
            ("M17.9", "Osteoarthritis of Knee", "Musculoskeletal", "Degenerative wear of knee cartilage."),
            ("M79.1", "Myalgia (Muscle Pain)", "Musculoskeletal", "Diffuse muscle pain and tenderness."),
            ("K21.9", "Gastro-Esophageal Reflux Disease", "Digestive", "Acid regurgitation and heartburn."),
            ("K29.70", "Gastritis, Unspecified", "Digestive", "Gastric mucosal inflammation."),
            ("K58.9", "Irritable Bowel Syndrome", "Digestive", "Recurrent abdominal discomfort and bowel habit changes."),
            ("N39.0", "Urinary Tract Infection", "Urological", "Bacterial infection of urinary tract."),
            ("N18.3", "Chronic Kidney Disease, Stage 3", "Nephrology", "Moderate reduction in glomerular filtration."),
            ("G43.909", "Migraine, Unspecified", "Neurological", "Recurrent pulsating hemicephalic headache."),
            ("G40.909", "Epilepsy, Unspecified", "Neurological", "Tendency to recurrent unprovoked seizures."),
            ("L20.9", "Atopic Dermatitis (Eczema)", "Dermatology", "Pruritic chronic skin inflammation."),
            ("L70.0", "Acne Vulgaris", "Dermatology", "Inflammation of pilosebaceous units."),
            ("B34.9", "Viral Infection, Unspecified", "Infectious", "Acute febrile viral illness."),
            ("A09", "Infectious Gastroenteritis & Colitis", "Infectious", "Acute diarrhea and vomiting of presumed infectious origin."),
            ("H10.9", "Conjunctivitis, Unspecified", "Ophthalmology", "Pink eye inflammation of conjunctiva."),
            ("H52.13", "Myopia, Bilateral", "Ophthalmology", "Nearsightedness visual impairment."),
            ("H66.90", "Otitis Media, Unspecified", "ENT", "Middle ear infection and pain."),
            ("J30.9", "Allergic Rhinitis, Unspecified", "ENT", "Hay fever and allergic nasal congestion."),
            ("F41.1", "Generalized Anxiety Disorder", "Psychiatry", "Excessive anxiety and worry across daily events."),
            ("F32.9", "Major Depressive Disorder, Single Episode", "Psychiatry", "Depressed mood, anhedonia, and fatigue.")
        ]
        cursor.executemany(
            "INSERT INTO diseases (icd_code, disease_name, category, description) VALUES (%s, %s, %s, %s);",
            diseases_data
        )
        print(f"Inserted {len(diseases_data)} diseases.")

        # ---------------------------------------------------------------------
        # 17. Consultations (25 records: 1:1 with distinct appointments)
        # 3NF verified: doctor_id and diagnosis_summary eliminated
        # ---------------------------------------------------------------------
        consultations_data = []
        cursor.execute("SELECT appointment_id, appointment_date FROM appointments ORDER BY appointment_id LIMIT 25;")
        chosen_appts = cursor.fetchall()

        for idx, row in enumerate(chosen_appts):
            appt_id = row["appointment_id"]
            cursor.execute("UPDATE appointments SET status = 'Completed' WHERE appointment_id = %s;", (appt_id,))
            c_date = datetime.combine(row["appointment_date"], datetime.min.time()) + timedelta(hours=10)
            symptoms = "Patient presents with persistent symptoms, mild distress, but hemodynamically stable."
            notes = "Physical examination completed. Vitals stable. Prescribed appropriate medication and lifestyle modifications."
            consultations_data.append((appt_id, symptoms, notes, c_date))

        cursor.executemany(
            "INSERT INTO consultations (appointment_id, symptoms, clinical_notes, consultation_date) VALUES (%s, %s, %s, %s);",
            consultations_data
        )
        print(f"Inserted {len(consultations_data)} consultations.")

        # ---------------------------------------------------------------------
        # 18. Diagnoses (30 records linking consultations to ICD codes)
        # ---------------------------------------------------------------------
        diagnoses_data = []
        severities = ["Mild", "Moderate", "Severe", "Critical"]
        icd_keys = [d[0] for d in diseases_data]

        for i in range(1, 31):
            consult_id = (i % len(consultations_data)) + 1
            icd = icd_keys[(i * 3) % len(icd_keys)]
            sev = severities[i % len(severities)]
            remarks = "Confirmed via clinical exam and patient history."
            diagnoses_data.append((consult_id, icd, sev, remarks))

        cursor.executemany(
            "INSERT INTO diagnoses (consultation_id, icd_code, severity, remarks) VALUES (%s, %s, %s, %s);",
            diagnoses_data
        )
        print(f"Inserted {len(diagnoses_data)} diagnoses.")

        # ---------------------------------------------------------------------
        # 19. Medicines Master (30 records)
        # ---------------------------------------------------------------------
        medicines_data = [
            ("Paracetamol", "500 mg", "Tablet", 2.50, "Cipla Ltd"),
            ("Paracetamol", "650 mg", "Tablet", 3.00, "Micro Labs (Dolo)"),
            ("Amoxicillin + Clavulanic Acid", "625 mg", "Tablet", 22.00, "GlaxoSmithKline (Augmentin)"),
            ("Metformin HCl", "500 mg", "Tablet", 4.50, "USV Pvt Ltd (Glycomet)"),
            ("Atorvastatin", "20 mg", "Tablet", 15.00, "Sun Pharma (Storvas)"),
            ("Omeprazole", "20 mg", "Capsule", 6.00, "Dr. Reddy's Laboratories (Omez)"),
            ("Pantoprazole", "40 mg", "Tablet", 10.00, "Alkem Laboratories (Pan-40)"),
            ("Cetirizine HCl", "10 mg", "Tablet", 3.50, "Cipla Ltd (Cetzine)"),
            ("Azithromycin", "500 mg", "Tablet", 25.00, "Lupin Pharmaceuticals (Aziwok)"),
            ("Losartan Potassium", "50 mg", "Tablet", 9.00, "Torrent Pharma (Losar-50)"),
            ("Amlodipine Besylate", "5 mg", "Tablet", 4.00, "Pfizer India (Amlogard)"),
            ("Ibuprofen", "400 mg", "Tablet", 4.00, "Abbott India (Brufen)"),
            ("Ciprofloxacin", "500 mg", "Tablet", 14.00, "Bayer Zydus (Ciplox)"),
            ("Levothyroxine Sodium", "50 mcg", "Tablet", 3.00, "Abbott (Thyronorm)"),
            ("Salbutamol Inhaler", "100 mcg", "Inhaler", 145.00, "Cipla (Asthalin)"),
            ("Montelukast + Levocetirizine", "10 mg / 5 mg", "Tablet", 18.00, "Sun Pharma (Montair-LC)"),
            ("Telmisartan", "40 mg", "Tablet", 12.00, "Glenmark (Telma-40)"),
            ("Gliclazide", "80 mg", "Tablet", 8.50, "Serdia Pharma (Diamicron)"),
            ("Insulin Glargine", "100 IU/ml", "Injection", 650.00, "Sanofi (Lantus)"),
            ("Cough Syrup (Dextromethorphan)", "100 ml", "Syrup", 85.00, "Piramal (Benadryl DR)"),
            ("Tramadol HCl", "50 mg", "Capsule", 11.00, "Cadila Healthcare"),
            ("Diclofenac Sodium Gel", "30 g", "Ointment", 75.00, "Novartis (Voveran Emulgel)"),
            ("Ranitidine", "150 mg", "Tablet", 3.00, "Cadila (Rantac)"),
            ("Ondansetron", "4 mg", "Tablet", 6.50, "GlaxoSmithKline (Emeset)"),
            ("Prednisolone", "10 mg", "Tablet", 5.00, "Pfizer (Wysolone)"),
            ("Clopidogrel", "75 mg", "Tablet", 16.00, "Sanofi (Plavix)"),
            ("Rosuvastatin", "10 mg", "Tablet", 18.00, "Sun Pharma (Rosuvas)"),
            ("Esomeprazole", "40 mg", "Tablet", 14.00, "Torrent (Nexpro)"),
            ("Cefixime", "200 mg", "Tablet", 20.00, "Mankind Pharma (Taxim-O)"),
            ("B-Complex with Vitamin C & Zinc", "Standard", "Capsule", 5.00, "Pfizer (Becosules)")
        ]
        cursor.executemany(
            """INSERT INTO medicines (name, strength, form, unit_price, manufacturer)
               VALUES (%s, %s, %s, %s, %s);""",
            medicines_data
        )
        print(f"Inserted {len(medicines_data)} medicines.")

        # ---------------------------------------------------------------------
        # 20. Pharmacy Inventory (30 records, linked 1:1 with medicines)
        # ---------------------------------------------------------------------
        inventory_data = []
        for med_id in range(1, 31):
            qty = random.choice([15, 25, 60, 120, 250, 400, 500]) # some below reorder
            reorder = random.choice([30, 40, 50])
            cost = round(random.uniform(2.0, 15.0), 2)
            inventory_data.append((med_id, qty, reorder, cost))
        cursor.executemany(
            """INSERT INTO pharmacy_inventory (medicine_id, quantity_in_stock, reorder_level, unit_cost)
               VALUES (%s, %s, %s, %s);""",
            inventory_data
        )
        print(f"Inserted {len(inventory_data)} pharmacy inventory items.")

        # ---------------------------------------------------------------------
        # 21. Prescriptions (25 records)
        # ---------------------------------------------------------------------
        prescriptions_data = []
        for c_id in range(1, len(consultations_data) + 1):
            prescriptions_data.append((c_id, datetime.now() - timedelta(days=c_id), "Take all medications with water after meals. Complete full antibiotic course."))
        cursor.executemany(
            "INSERT INTO prescriptions (consultation_id, issue_date, instructions) VALUES (%s, %s, %s);",
            prescriptions_data
        )
        print(f"Inserted {len(prescriptions_data)} prescriptions.")

        # ---------------------------------------------------------------------
        # 22. Prescription Items (Surrogate PK prescription_item_id) (40+ records)
        # ---------------------------------------------------------------------
        rx_items_data = []
        dosages = ["1 tablet", "2 tablets", "1 capsule", "5 ml syrup", "1 puff"]
        frequencies = ["Once daily at bedtime", "Twice daily after meals", "Thrice daily after food", "As needed for pain"]
        durations = ["3 days", "5 days", "7 days", "14 days", "30 days (Long term)"]

        for rx_id in range(1, len(prescriptions_data) + 1):
            # assign 2 medicines per prescription
            med1 = ((rx_id * 2) % 30) + 1
            med2 = ((rx_id * 2 + 1) % 30) + 1
            rx_items_data.append((rx_id, med1, dosages[rx_id % len(dosages)], frequencies[rx_id % len(frequencies)], durations[rx_id % len(durations)], "Take after breakfast"))
            rx_items_data.append((rx_id, med2, dosages[(rx_id + 1) % len(dosages)], frequencies[(rx_id + 1) % len(frequencies)], durations[(rx_id + 2) % len(durations)], "Do not skip doses"))

        cursor.executemany(
            """INSERT INTO prescription_items (prescription_id, medicine_id, dosage, frequency, duration, instructions)
               VALUES (%s, %s, %s, %s, %s, %s);""",
            rx_items_data
        )
        print(f"Inserted {len(rx_items_data)} prescription items.")

        # ---------------------------------------------------------------------
        # 23. Billings (30 records: for appointments and admissions)
        # ---------------------------------------------------------------------
        billings_data = []
        for i in range(1, 31):
            patient_id = (i % 35) + 1
            appt_id = i if i <= 20 else None
            adm_id = (i - 20) if i > 20 else None
            consult_fee = 800.00 if appt_id else 0.00
            bed_charges = (random.randint(2, 5) * 1500.00) if adm_id else 0.00
            pharma_charges = round(random.uniform(250.0, 1800.0), 2)
            other_charges = 150.00 # registration / nursing charges
            status = random.choice(["Paid", "Paid", "Paid", "Pending", "Partially_Paid"])
            billings_data.append((patient_id, appt_id, adm_id, consult_fee, bed_charges, pharma_charges, other_charges, status))

        cursor.executemany(
            """INSERT INTO billings (patient_id, appointment_id, admission_id, consultation_fee, bed_charges, pharmacy_charges, other_charges, payment_status)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s);""",
            billings_data
        )
        print(f"Inserted {len(billings_data)} billing records.")

        # ---------------------------------------------------------------------
        # 24. Payments (30 records: Financial transactions with auditing)
        # ---------------------------------------------------------------------
        payments_data = []
        pay_methods = ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking", "Insurance"]
        for bill_id in range(1, 31):
            # Fetch total amount
            cursor.execute("SELECT total_amount, payment_status FROM billings WHERE billing_id = %s;", (bill_id,))
            b_row = cursor.fetchone()
            tot = float(b_row["total_amount"])
            b_stat = b_row["payment_status"]

            if b_stat == "Paid":
                amt = tot
                trans_stat = "Success"
            elif b_stat == "Partially_Paid":
                amt = round(tot * 0.5, 2)
                trans_stat = "Success"
            else:
                amt = 0.00
                trans_stat = "Pending"

            if amt > 0:
                method = pay_methods[bill_id % len(pay_methods)]
                ref_no = f"TXN-HOSP-2026-{bill_id:04d}-{random.randint(1000, 9999)}"
                p_time = datetime.now() - timedelta(days=random.randint(0, 15), hours=random.randint(1, 12))
                payments_data.append((bill_id, p_time, amt, method, trans_stat, ref_no))

        cursor.executemany(
            """INSERT INTO payments (billing_id, payment_time, amount_paid, payment_method, transaction_status, reference_number)
               VALUES (%s, %s, %s, %s, %s, %s);""",
            payments_data
        )
        print(f"Inserted {len(payments_data)} payment transactions.")

        # Commit all transactions
        conn.commit()
        print("All 24 tables successfully populated and committed!")

    except Exception as e:
        conn.rollback()
        print(f"ERROR DURING SEEDING: {e}", file=sys.stderr)
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_database()

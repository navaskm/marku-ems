from datetime import date
import re
from django.contrib.auth.models import User
from django.db import transaction
from .models import Company, Department, Employee

DEMO_COMPANIES = [
    {
        "code": "ACME",
        "name": "Acme Technologies",
        "industry": "Software",
        "headquarters": "Austin, TX",
        "timezone": "America/Chicago",
        "work_start": "09:00",
        "late_after": "09:15",
        "work_end": "18:00",
    },
    {
        "code": "BRIGHT",
        "name": "Bright Solutions",
        "industry": "Management consulting",
        "headquarters": "Chicago, IL",
        "timezone": "America/Chicago",
        "work_start": "09:00",
        "late_after": "09:15",
        "work_end": "18:00",
    },
]

DEMO_DEPARTMENTS = [
    {"company_code": "ACME", "name": "Engineering", "description": "Product engineering and platform teams"},
    {"company_code": "ACME", "name": "Product", "description": "Product management and research"},
    {"company_code": "ACME", "name": "Design", "description": "Product design and research"},
    {"company_code": "ACME", "name": "People Operations", "description": "HR, recruiting, and employee experience"},
    {"company_code": "ACME", "name": "Finance", "description": "Planning, payroll, and reporting"},
    {"company_code": "ACME", "name": "Sales", "description": "Account executive and customer success teams"},
    {"company_code": "BRIGHT", "name": "Consulting", "description": "Client strategy and advisory"},
    {"company_code": "BRIGHT", "name": "Delivery", "description": "Engagement management and solutions"},
    {"company_code": "BRIGHT", "name": "Marketing", "description": "Demand generation and brand"},
    {"company_code": "BRIGHT", "name": "Operations", "description": "Internal operations and enablement"},
    {"company_code": "BRIGHT", "name": "Human Resources", "description": "People programs and recruiting"},
    {"company_code": "BRIGHT", "name": "Finance", "description": "Client billing and company finance"},
]

DEMO_EMPLOYEES = [
    # Acme Technologies
    {
        "email": "manager@acme.demo",
        "company_code": "ACME",
        "role": "manager",
        "employee_code": "ACME-1001",
        "first_name": "Priya",
        "last_name": "Mehta",
        "phone": "+1 (512) 555-0142",
        "dept_name": "People Operations",
        "job_title": "Head of People",
        "manager_email": None,
        "joining_date": date(2019, 3, 11),
        "avatar_hue": 258,
    },
    {
        "email": "employee@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1842",
        "first_name": "Rajesh",
        "last_name": "Kumar",
        "phone": "+1 (512) 555-0198",
        "dept_name": "Engineering",
        "job_title": "Software Engineer",
        "manager_email": "diego.alvarez@acme.demo",
        "joining_date": date(2022, 6, 13),
        "avatar_hue": 204,
    },
    {
        "email": "anita.sharma@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1760",
        "first_name": "Anita",
        "last_name": "Sharma",
        "phone": "+1 (512) 555-0114",
        "dept_name": "Engineering",
        "job_title": "Senior Software Engineer",
        "manager_email": "diego.alvarez@acme.demo",
        "joining_date": date(2020, 9, 8),
        "avatar_hue": 332,
    },
    {
        "email": "michael.chen@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1904",
        "first_name": "Michael",
        "last_name": "Chen",
        "phone": "+1 (512) 555-0177",
        "dept_name": "Engineering",
        "job_title": "Frontend Engineer",
        "manager_email": "diego.alvarez@acme.demo",
        "joining_date": date(2023, 1, 16),
        "avatar_hue": 196,
    },
    {
        "email": "fatima.alsayed@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1888",
        "first_name": "Fatima",
        "last_name": "Al-Sayed",
        "phone": "+1 (512) 555-0161",
        "dept_name": "Engineering",
        "job_title": "Backend Engineer",
        "manager_email": "diego.alvarez@acme.demo",
        "joining_date": date(2022, 11, 2),
        "avatar_hue": 168,
    },
    {
        "email": "jonah.brooks@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-2011",
        "first_name": "Jonah",
        "last_name": "Brooks",
        "phone": "+1 (512) 555-0133",
        "dept_name": "Engineering",
        "job_title": "QA Engineer",
        "manager_email": "diego.alvarez@acme.demo",
        "joining_date": date(2024, 2, 19),
        "avatar_hue": 28,
    },
    {
        "email": "leila.hassan@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1622",
        "first_name": "Leila",
        "last_name": "Hassan",
        "phone": "+1 (512) 555-0184",
        "dept_name": "Product",
        "job_title": "Product Manager",
        "manager_email": "manager@acme.demo",
        "joining_date": date(2021, 4, 26),
        "avatar_hue": 312,
    },
    {
        "email": "tomas.novak@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1744",
        "first_name": "Tomas",
        "last_name": "Novak",
        "phone": "+1 (512) 555-0129",
        "dept_name": "Design",
        "job_title": "Product Designer",
        "manager_email": "manager@acme.demo",
        "joining_date": date(2021, 8, 9),
        "avatar_hue": 42,
    },
    {
        "email": "sarah.williams@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1810",
        "first_name": "Sarah",
        "last_name": "Williams",
        "phone": "+1 (512) 555-0155",
        "dept_name": "Design",
        "job_title": "UX Researcher",
        "manager_email": "manager@acme.demo",
        "joining_date": date(2022, 3, 21),
        "avatar_hue": 280,
    },
    {
        "email": "arjun.patel@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1933",
        "first_name": "Arjun",
        "last_name": "Patel",
        "phone": "+1 (512) 555-0108",
        "dept_name": "Engineering",
        "job_title": "DevOps Engineer",
        "manager_email": "diego.alvarez@acme.demo",
        "joining_date": date(2023, 5, 8),
        "avatar_hue": 148,
    },
    {
        "email": "claire.dubois@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1550",
        "first_name": "Claire",
        "last_name": "Dubois",
        "phone": "+1 (512) 555-0191",
        "dept_name": "People Operations",
        "job_title": "People Partner",
        "manager_email": "manager@acme.demo",
        "joining_date": date(2020, 1, 14),
        "avatar_hue": 348,
    },
    {
        "email": "kenji.sato@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1488",
        "first_name": "Kenji",
        "last_name": "Sato",
        "phone": "+1 (512) 555-0172",
        "dept_name": "Finance",
        "job_title": "Finance Analyst",
        "manager_email": "manager@acme.demo",
        "joining_date": date(2019, 11, 4),
        "avatar_hue": 18,
    },
    {
        "email": "olivia.grant@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1702",
        "first_name": "Olivia",
        "last_name": "Grant",
        "phone": "+1 (512) 555-0147",
        "dept_name": "Sales",
        "job_title": "Account Executive",
        "manager_email": "manager@acme.demo",
        "joining_date": date(2021, 2, 1),
        "avatar_hue": 222,
    },
    {
        "email": "marcus.johnson@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1866",
        "first_name": "Marcus",
        "last_name": "Johnson",
        "phone": "+1 (512) 555-0122",
        "dept_name": "Sales",
        "job_title": "Sales Engineer",
        "manager_email": "manager@acme.demo",
        "joining_date": date(2022, 8, 15),
        "avatar_hue": 8,
    },
    {
        "email": "nina.volkov@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1980",
        "first_name": "Nina",
        "last_name": "Volkov",
        "phone": "+1 (512) 555-0168",
        "dept_name": "Product",
        "job_title": "Data Analyst",
        "manager_email": "leila.hassan@acme.demo",
        "joining_date": date(2023, 9, 11),
        "avatar_hue": 268,
    },
    {
        "email": "hannah.berg@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1795",
        "first_name": "Hannah",
        "last_name": "Berg",
        "phone": "+1 (512) 555-0119",
        "dept_name": "Sales",
        "job_title": "Customer Success Manager",
        "manager_email": "olivia.grant@acme.demo",
        "joining_date": date(2022, 4, 4),
        "avatar_hue": 118,
    },
    {
        "email": "diego.alvarez@acme.demo",
        "company_code": "ACME",
        "role": "employee",
        "employee_code": "ACME-1412",
        "first_name": "Diego",
        "last_name": "Alvarez",
        "phone": "+1 (512) 555-0188",
        "dept_name": "Engineering",
        "job_title": "Engineering Manager",
        "manager_email": "manager@acme.demo",
        "joining_date": date(2018, 7, 23),
        "avatar_hue": 188,
    },

    # Bright Solutions
    {
        "email": "manager@bright.demo",
        "company_code": "BRIGHT",
        "role": "manager",
        "employee_code": "BRT-2001",
        "first_name": "Daniel",
        "last_name": "Okonkwo",
        "phone": "+1 (312) 555-0240",
        "dept_name": "Human Resources",
        "job_title": "Director of People",
        "manager_email": None,
        "joining_date": date(2018, 5, 7),
        "avatar_hue": 232,
    },
    {
        "email": "employee@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2488",
        "first_name": "Maya",
        "last_name": "Patel",
        "phone": "+1 (312) 555-0211",
        "dept_name": "Consulting",
        "job_title": "Management Consultant",
        "manager_email": "elena.popov@bright.demo",
        "joining_date": date(2022, 9, 19),
        "avatar_hue": 304,
    },
    {
        "email": "liam.oconnor@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2310",
        "first_name": "Liam",
        "last_name": "O'Connor",
        "phone": "+1 (312) 555-0276",
        "dept_name": "Consulting",
        "job_title": "Senior Consultant",
        "manager_email": "elena.popov@bright.demo",
        "joining_date": date(2020, 6, 15),
        "avatar_hue": 210,
    },
    {
        "email": "sofia.mendes@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2522",
        "first_name": "Sofia",
        "last_name": "Mendes",
        "phone": "+1 (312) 555-0294",
        "dept_name": "Consulting",
        "job_title": "Strategy Analyst",
        "manager_email": "elena.popov@bright.demo",
        "joining_date": date(2023, 3, 6),
        "avatar_hue": 338,
    },
    {
        "email": "wei.zhang@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2188",
        "first_name": "Wei",
        "last_name": "Zhang",
        "phone": "+1 (312) 555-0208",
        "dept_name": "Delivery",
        "job_title": "Delivery Manager",
        "manager_email": "manager@bright.demo",
        "joining_date": date(2019, 10, 21),
        "avatar_hue": 176,
    },
    {
        "email": "amara.nwosu@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2440",
        "first_name": "Amara",
        "last_name": "Nwosu",
        "phone": "+1 (312) 555-0233",
        "dept_name": "Delivery",
        "job_title": "Project Coordinator",
        "manager_email": "wei.zhang@bright.demo",
        "joining_date": date(2022, 1, 10),
        "avatar_hue": 48,
    },
    {
        "email": "ethan.baker@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2266",
        "first_name": "Ethan",
        "last_name": "Baker",
        "phone": "+1 (312) 555-0259",
        "dept_name": "Marketing",
        "job_title": "Marketing Lead",
        "manager_email": "manager@bright.demo",
        "joining_date": date(2020, 2, 17),
        "avatar_hue": 12,
    },
    {
        "email": "julia.rossi@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2501",
        "first_name": "Julia",
        "last_name": "Rossi",
        "phone": "+1 (312) 555-0281",
        "dept_name": "Marketing",
        "job_title": "Content Strategist",
        "manager_email": "ethan.baker@bright.demo",
        "joining_date": date(2023, 7, 24),
        "avatar_hue": 320,
    },
    {
        "email": "noah.kim@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2377",
        "first_name": "Noah",
        "last_name": "Kim",
        "phone": "+1 (312) 555-0226",
        "dept_name": "Operations",
        "job_title": "Operations Analyst",
        "manager_email": "grace.nakamura@bright.demo",
        "joining_date": date(2021, 11, 29),
        "avatar_hue": 198,
    },
    {
        "email": "isabelle.laurent@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2214",
        "first_name": "Isabelle",
        "last_name": "Laurent",
        "phone": "+1 (312) 555-0264",
        "dept_name": "Human Resources",
        "job_title": "HR Generalist",
        "manager_email": "manager@bright.demo",
        "joining_date": date(2020, 8, 3),
        "avatar_hue": 286,
    },
    {
        "email": "carlos.rivera@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2140",
        "first_name": "Carlos",
        "last_name": "Rivera",
        "phone": "+1 (312) 555-0202",
        "dept_name": "Finance",
        "job_title": "Finance Manager",
        "manager_email": "manager@bright.demo",
        "joining_date": date(2019, 4, 15),
        "avatar_hue": 22,
    },
    {
        "email": "aisha.rahman@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2466",
        "first_name": "Aisha",
        "last_name": "Rahman",
        "phone": "+1 (312) 555-0290",
        "dept_name": "Consulting",
        "job_title": "Business Analyst",
        "manager_email": "liam.oconnor@bright.demo",
        "joining_date": date(2022, 12, 5),
        "avatar_hue": 154,
    },
    {
        "email": "peter.holm@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2399",
        "first_name": "Peter",
        "last_name": "Holm",
        "phone": "+1 (312) 555-0248",
        "dept_name": "Delivery",
        "job_title": "Technical Consultant",
        "manager_email": "wei.zhang@bright.demo",
        "joining_date": date(2021, 5, 18),
        "avatar_hue": 132,
    },
    {
        "email": "elena.popov@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2098",
        "first_name": "Elena",
        "last_name": "Popov",
        "phone": "+1 (312) 555-0271",
        "dept_name": "Consulting",
        "job_title": "Client Partner",
        "manager_email": "manager@bright.demo",
        "joining_date": date(2018, 11, 12),
        "avatar_hue": 352,
    },
    {
        "email": "ryan.mitchell@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2555",
        "first_name": "Ryan",
        "last_name": "Mitchell",
        "phone": "+1 (312) 555-0218",
        "dept_name": "Human Resources",
        "job_title": "Recruiter",
        "manager_email": "isabelle.laurent@bright.demo",
        "joining_date": date(2024, 1, 8),
        "avatar_hue": 64,
    },
    {
        "email": "grace.nakamura@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2280",
        "first_name": "Grace",
        "last_name": "Nakamura",
        "phone": "+1 (312) 555-0255",
        "dept_name": "Operations",
        "job_title": "Operations Specialist",
        "manager_email": "manager@bright.demo",
        "joining_date": date(2020, 9, 28),
        "avatar_hue": 242,
    },
    {
        "email": "omar.haddad@bright.demo",
        "company_code": "BRIGHT",
        "role": "employee",
        "employee_code": "BRT-2412",
        "first_name": "Omar",
        "last_name": "Haddad",
        "phone": "+1 (312) 555-0288",
        "dept_name": "Delivery",
        "job_title": "Solutions Architect",
        "manager_email": "wei.zhang@bright.demo",
        "joining_date": date(2021, 8, 2),
        "avatar_hue": 186,
    },
]

DEMO_COMPANIES = [
    {
        "code": "MARKU",
        "name": "MarkU — The Life Design Academy",
        "industry": "Education",
        "headquarters": "India",
        "timezone": "Asia/Calcutta",
        "work_start": "09:00",
        "late_after": "09:15",
        "work_end": "18:00",
    },
]

DEMO_DEPARTMENTS = [
    {"company_code": "MARKU", "name": "Management", "description": "Leadership and company direction"},
    {"company_code": "MARKU", "name": "Human Resources", "description": "People operations and employee experience"},
    {"company_code": "MARKU", "name": "Sales", "description": "Admissions, partnerships, and learner growth"},
    {"company_code": "MARKU", "name": "Digital Marketing", "description": "Digital campaigns, content, and brand growth"},
    {"company_code": "MARKU", "name": "Development", "description": "Technology, products, and platform development"},
]

DEMO_EMPLOYEES = [
    {"email": "owner@marku.demo", "company_code": "MARKU", "role": "manager", "employee_code": "MARKU-1001", "first_name": "Saleeth", "last_name": "", "phone": "+91 98765 43210", "dept_name": "Management", "job_title": "Owner, MarkU", "manager_email": None, "joining_date": date(2019, 1, 1), "avatar_hue": 166},
    {"email": "vithin@marku.demo", "company_code": "MARKU", "role": "employee", "employee_code": "MARKU-1002", "first_name": "Vithin", "last_name": "", "phone": "+91 98765 43211", "dept_name": "Human Resources", "job_title": "HR Manager", "manager_email": "owner@marku.demo", "joining_date": date(2021, 6, 1), "avatar_hue": 196},
    {"email": "mubashira@marku.demo", "company_code": "MARKU", "role": "employee", "employee_code": "MARKU-1101", "first_name": "Mubashira", "last_name": "", "phone": "+91 98765 43212", "dept_name": "Sales", "job_title": "Sales Executive", "manager_email": "vithin@marku.demo", "joining_date": date(2023, 1, 9), "avatar_hue": 242},
    {"email": "angel@marku.demo", "company_code": "MARKU", "role": "employee", "employee_code": "MARKU-1102", "first_name": "Angel", "last_name": "", "phone": "+91 98765 43213", "dept_name": "Sales", "job_title": "Sales Executive", "manager_email": "vithin@marku.demo", "joining_date": date(2023, 3, 13), "avatar_hue": 312},
    {"email": "shafi@marku.demo", "company_code": "MARKU", "role": "employee", "employee_code": "MARKU-1103", "first_name": "Shafi", "last_name": "", "phone": "+91 98765 43214", "dept_name": "Digital Marketing", "job_title": "Digital Marketing Executive", "manager_email": "vithin@marku.demo", "joining_date": date(2022, 11, 7), "avatar_hue": 28},
    {"email": "rinshad@marku.demo", "company_code": "MARKU", "role": "employee", "employee_code": "MARKU-1104", "first_name": "Rinshad", "last_name": "", "phone": "+91 98765 43215", "dept_name": "Development", "job_title": "Developer", "manager_email": "vithin@marku.demo", "joining_date": date(2022, 7, 18), "avatar_hue": 204},
    {"email": "sana@marku.demo", "company_code": "MARKU", "role": "employee", "employee_code": "MARKU-1105", "first_name": "Sana", "last_name": "", "phone": "+91 98765 43216", "dept_name": "Digital Marketing", "job_title": "Digital Marketing Executive", "manager_email": "vithin@marku.demo", "joining_date": date(2023, 5, 22), "avatar_hue": 348},
    {"email": "navas@marku.demo", "company_code": "MARKU", "role": "employee", "employee_code": "MARKU-1106", "first_name": "Navas", "last_name": "", "phone": "+91 98765 43217", "dept_name": "Development", "job_title": "Developer", "manager_email": "vithin@marku.demo", "joining_date": date(2024, 1, 15), "avatar_hue": 148},
    {"email": "rahul@marku.demo", "company_code": "MARKU", "role": "employee", "employee_code": "MARKU-1107", "first_name": "Rahul", "last_name": "", "phone": "+91 98765 43218", "dept_name": "Digital Marketing", "job_title": "Digital Marketing Executive", "manager_email": "vithin@marku.demo", "joining_date": date(2024, 4, 8), "avatar_hue": 80},
]

def ensure_demo_data():
    """Ensure all demo companies, departments, and employees exist in the database."""
    with transaction.atomic():
        old_demo_users = User.objects.filter(username__regex=r"@(acme|bright)\.demo$")
        old_demo_users.delete()
        Employee.objects.filter(company__code__in=["ACME", "BRIGHT"]).delete()
        Department.objects.filter(company__code__in=["ACME", "BRIGHT"]).delete()
        Company.objects.filter(code__in=["ACME", "BRIGHT"]).delete()
        company_map = {}
        for c in DEMO_COMPANIES:
            company, _ = Company.objects.get_or_create(
                code=c["code"],
                defaults={
                    "name": c["name"],
                    "industry": c["industry"],
                    "headquarters": c["headquarters"],
                    "timezone": c["timezone"],
                    "work_start": c.get("work_start", "09:00"),
                    "late_after": c.get("late_after", "09:15"),
                    "work_end": c.get("work_end", "18:00"),
                },
            )
            company_map[c["code"]] = company

        dept_map = {}
        for d in DEMO_DEPARTMENTS:
            comp = company_map.get(d["company_code"])
            if comp:
                dept, _ = Department.objects.get_or_create(
                    company=comp,
                    name=d["name"],
                    defaults={"description": d["description"]},
                )
                dept_map[(d["company_code"], d["name"])] = dept

        for e in DEMO_EMPLOYEES:
            comp = company_map.get(e["company_code"])
            dept = dept_map.get((e["company_code"], e["dept_name"]))
            if not comp or not dept:
                continue

            user, created = User.objects.get_or_create(
                username=e["email"],
                defaults={"email": e["email"]},
            )
            if created:
                user.set_unusable_password()
                user.save(update_fields=["password"])

            default_pwd = re.sub(r"[^a-zA-Z0-9]", "", f"{e['first_name']}{e['last_name']}").lower()
            emp, _ = Employee.objects.get_or_create(
                user=user,
                defaults={
                    "company": comp,
                    "employee_code": e["employee_code"],
                    "first_name": e["first_name"],
                    "last_name": e["last_name"],
                    "phone": e["phone"],
                    "department": dept,
                    "job_title": e["job_title"],
                    "joining_date": e["joining_date"],
                    "status": "active",
                    "role": e["role"],
                    "avatar_hue": e.get("avatar_hue", 220),
                    "plain_password": default_pwd,
                },
            )
            if not emp.plain_password:
                emp.plain_password = default_pwd
                emp.save(update_fields=["plain_password"])

        # Second pass: wire managers
        for e in DEMO_EMPLOYEES:
            if e.get("manager_email"):
                emp = Employee.objects.filter(user__email=e["email"]).first()
                mgr = Employee.objects.filter(user__email=e["manager_email"]).first()
                if emp and mgr and emp.manager_id != mgr.id:
                    emp.manager = mgr
                    emp.save(update_fields=["manager"])


def ensure_demo_employee(identifier):
    """Ensure a specific demo employee exists in the database if identifier matches a demo record."""
    clean_id = str(identifier or "").strip().lower()
    match = next((e for e in DEMO_EMPLOYEES if e["email"].lower() == clean_id), None)
    if not match:
        return None

    # Keep the API database aligned with the current MarkU demo dataset before
    # authenticating a demo account. This also removes the previous demo companies.
    ensure_demo_data()

    with transaction.atomic():
        c_info = next((c for c in DEMO_COMPANIES if c["code"] == match["company_code"]), None)
        if not c_info:
            return None
        company, _ = Company.objects.get_or_create(
            code=c_info["code"],
            defaults={
                "name": c_info["name"],
                "industry": c_info["industry"],
                "headquarters": c_info["headquarters"],
                "timezone": c_info["timezone"],
                "work_start": c_info.get("work_start", "09:00"),
                "late_after": c_info.get("late_after", "09:15"),
                "work_end": c_info.get("work_end", "18:00"),
            },
        )
        d_info = next((d for d in DEMO_DEPARTMENTS if d["company_code"] == match["company_code"] and d["name"] == match["dept_name"]), None)
        dept, _ = Department.objects.get_or_create(
            company=company,
            name=match["dept_name"],
            defaults={"description": d_info["description"] if d_info else match["dept_name"]},
        )
        user, created = User.objects.get_or_create(
            username=match["email"],
            defaults={"email": match["email"]},
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])

        default_pwd = re.sub(r"[^a-zA-Z0-9]", "", f"{match['first_name']}{match['last_name']}").lower()
        employee, _ = Employee.objects.get_or_create(
            user=user,
            defaults={
                "company": company,
                "employee_code": match["employee_code"],
                "first_name": match["first_name"],
                "last_name": match["last_name"],
                "phone": match["phone"],
                "department": dept,
                "job_title": match["job_title"],
                "joining_date": match["joining_date"],
                "status": "active",
                "role": match["role"],
                "avatar_hue": match.get("avatar_hue", 220),
                "plain_password": default_pwd,
            },
        )
        if not employee.plain_password:
            employee.plain_password = default_pwd
            employee.save(update_fields=["plain_password"])
        return employee

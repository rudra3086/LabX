# SMARTLAB — MASTER PROJECT SPECIFICATION

## 0. DOCUMENT PURPOSE

You are an expert senior full-stack software engineer, software architect, UI/UX engineer, database designer, QA engineer, and technical project manager.

Your task is to design and implement a production-ready web platform called **SmartLab**.

SmartLab is a centralized practical/laboratory work management and submission platform for college students and faculty.

This document is the SINGLE SOURCE OF TRUTH for the current project.

You MUST read and understand the entire specification before writing or modifying code.

Do not invent functionality that is not specified.

Do not remove functionality that is explicitly required.

Do not implement future AI/RAG functionality in the current version.

The current goal is to build a reliable **practical-session, task-submission, file-management, grading, remarks, deadline, and monthly-report platform**.

---

# 1. PROJECT NAME

## SmartLab

SmartLab is a centralized academic practical management platform.

The platform should allow:

* Administrators to manage subjects and teachers.
* Faculty to manage practical sessions, students, tasks, deadlines, reference materials, submissions, grades, and remarks.
* Students to view assigned practical sessions and tasks.
* Students to perform/prepare their practical work and upload required files.
* The platform to autosave work where applicable.
* Students to submit practical files.
* Faculty to review submissions from one centralized interface.
* Faculty to assign marks and remarks.
* Students to see their grades and remarks.
* The platform to track submission status and deadlines.
* The platform to generate monthly student performance reports.

---

# 2. CORE PROBLEM

The existing practical/laboratory workflow has several problems.

## 2.1 Student Problems

### Problem 1 — Last-minute submissions

Students frequently complete practical work at the end of the semester or immediately before deadlines.

This causes:

* rushed work
* poor documentation
* forgotten submissions
* missing practical files
* difficulty tracking multiple subjects
* inconsistent submission formats

### Problem 2 — Poor documentation

Students do not maintain practical work properly.

Practical files, screenshots, reports, code, PDFs, and other evidence are scattered across:

* local computers
* folders
* cloud storage
* messaging applications
* email
* personal devices

There is no centralized academic practical record.

### Problem 3 — Multiple subjects

Students have multiple practical subjects.

Each subject may have:

* different faculty
* different deadlines
* different file requirements
* different practical tasks
* different grading criteria

Students need a single platform where all practical work can be managed.

### Problem 4 — Forgotten deadlines

Students may forget to submit work before deadlines.

The platform therefore needs:

* upcoming deadline visibility
* missed deadline visibility
* submission status
* reminders/notifications

### Problem 5 — Non-coding practicals

Non-coding subjects may require:

* screenshots
* images
* PDFs
* documents
* proof of completed work
* practical records

The platform must support different file types.

### Problem 6 — Lack of resources

While performing practicals, students may require:

* reference documents
* guidelines
* examples
* instructions
* faculty-provided resources

Each practical task should therefore be able to contain reference material.

---

# 2.2 Faculty Problems

### Problem 1 — Manual submission management

Faculty currently have to collect submissions from multiple locations.

This makes it difficult to determine:

* who submitted
* who did not submit
* who submitted late
* which students are pending
* which files belong to which practical

SmartLab should centralize this workflow.

### Problem 2 — Manual grading workflow

Faculty need to review practical submissions and assign:

* marks
* remarks
* feedback

The platform should provide a centralized grading interface.

### Problem 3 — Difficulty identifying struggling students

Faculty need visibility into student performance.

They should be able to identify:

* students with low marks
* students with repeated late submissions
* students with missing submissions
* students whose performance is declining
* students requiring attention

### Problem 4 — Reporting

Faculty need reports that summarize student performance.

The platform should generate monthly reports containing relevant academic/practical performance information.

---

# 3. CURRENT PROJECT SCOPE

## IMPORTANT

The current SmartLab version is an MVP.

The MVP is ONLY responsible for:

1. Authentication
2. Role-based access
3. Subject management
4. Teacher management
5. Student management
6. Practical session management
7. Task management
8. Deadline management
9. Reference-material management
10. Student submissions
11. File uploads
12. Autosave where applicable
13. Faculty grading
14. Faculty remarks
15. Student grade visibility
16. Submission status tracking
17. Deadline tracking
18. Notifications/reminders
19. Monthly reports
20. Basic dashboards
21. Auditability and data integrity

---

# 4. EXPLICITLY OUT OF SCOPE

DO NOT IMPLEMENT THESE FEATURES IN THE CURRENT VERSION.

These are FUTURE features.

## 4.1 AI grading

DO NOT implement:

* AI-based grading
* LLM grading
* automatic evaluation using an LLM
* AI-generated marks
* AI-generated feedback

Faculty manually assign marks.

---

## 4.2 Plagiarism detection

DO NOT implement:

* plagiarism detection
* code similarity algorithms
* copied-code detection
* AI-generated-code detection
* GitHub similarity checking
* external plagiarism APIs

The architecture may be designed so that this can be added later.

But the feature itself MUST NOT be implemented now.

---

## 4.3 RAG

DO NOT implement:

* Retrieval Augmented Generation
* vector databases
* embeddings
* semantic search
* syllabus RAG
* document chunking for RAG
* LLM-based retrieval

RAG is a future feature.

---

## 4.4 AI Viva Generator

DO NOT implement:

* AI-generated viva questions
* syllabus-based LLM question generation
* automatic viva evaluation

This is a future feature.

---

## 4.5 AI productivity monitoring

DO NOT implement:

* AI usage tracking
* AI productivity scoring
* AI usage detection
* ChatGPT usage detection
* AI-generated-content detection

---

## 4.6 Advanced AI analytics

DO NOT implement:

* predictive analytics
* student dropout prediction
* performance prediction using ML
* AI recommendations
* intelligent intervention systems

---

# 5. FUTURE FEATURES

The architecture should remain extensible for the following future modules:

* plagiarism detection
* code similarity detection
* AI-assisted grading
* RAG-based syllabus assistant
* AI viva question generator
* AI-generated feedback
* AI productivity workflow
* advanced student analytics
* intelligent recommendations

However:

## DO NOT BUILD THEM NOW.

Use clean interfaces/services where necessary so they can be added later without rewriting the entire application.

---

# 6. USER ROLES

There are three primary roles.

## 6.1 ADMIN

Admin manages the academic structure.

Admin can:

* create subjects
* update subjects
* deactivate subjects
* add teachers
* update teachers
* deactivate teachers
* assign teachers to subjects where applicable
* manage students
* view overall platform information

Admin is NOT responsible for grading practical submissions.

---

# 6.2 FACULTY / TEACHER

Faculty manages practical academic work.

Faculty can:

* view assigned subjects
* create practical sessions
* create practical tasks
* set task instructions
* set deadlines
* upload reference materials
* add students to sessions/classes
* view student submissions
* download submitted files
* review submissions
* assign marks
* add remarks
* update marks/remarks where permitted
* track pending submissions
* track late submissions
* view student performance
* generate monthly reports
* view class-level performance
* view student-level performance

---

# 6.3 STUDENT

Students can:

* log in
* view enrolled subjects
* view active practical sessions
* view assigned tasks
* view task instructions
* view deadlines
* view reference materials
* upload practical files
* save work
* submit practical work
* see submission status
* see submission timestamp
* see marks
* see faculty remarks
* see monthly performance report
* see upcoming deadlines
* see missed deadlines

Students cannot:

* create subjects
* create faculty
* grade themselves
* modify faculty marks
* modify faculty remarks
* access another student's submission
* access another student's grades
* access administrative functionality

---

# 7. HIGH-LEVEL SYSTEM WORKFLOW

The system workflow is:

ADMIN
↓
Create Subject
↓
Add Faculty
↓
Assign Faculty
↓
Faculty creates Practical Session
↓
Faculty adds Students
↓
Faculty creates Practical Task
↓
Faculty sets deadline
↓
Faculty adds instructions/resources
↓
Student sees task
↓
Student performs practical
↓
Student uploads files
↓
System autosaves where supported
↓
Student submits
↓
System records submission timestamp
↓
Faculty sees submission
↓
Faculty reviews files
↓
Faculty assigns marks
↓
Faculty adds remarks
↓
Student sees marks + remarks
↓
System stores performance data
↓
Monthly Report generated

---

# 8. AUTHENTICATION

The platform must have secure authentication.

Required:

* login
* logout
* password handling
* role-based access
* protected routes
* session/token management
* unauthorized access prevention

Each user must have a unique identity.

Minimum user fields:

* id
* name
* email
* role
* status
* createdAt
* updatedAt

Possible roles:

```text
ADMIN
FACULTY
STUDENT
```

---

# 9. ROLE-BASED ACCESS CONTROL

Every protected API route must verify:

1. user authentication
2. user role
3. resource ownership/access

Example:

A student must NOT be able to access:

```text
GET /admin/subjects
```

A faculty member must NOT be able to modify another faculty member's unrelated session.

A student must NOT be able to access:

```text
GET /students/{otherStudentId}/grades
```

The backend must enforce permissions.

Do NOT rely only on frontend route protection.

---

# 10. ADMIN MODULE

## 10.1 Admin Dashboard

Admin dashboard should provide:

* total students
* total faculty
* total subjects
* active sessions
* basic platform statistics

---

# 11. SUBJECT MANAGEMENT

Admin must be able to:

### Create subject

Required fields:

* subject code
* subject name
* semester
* department
* description
* status

Example:

```text
Subject Code: CSE401
Subject Name: Database Management System
Semester: 4
Department: CSE
Status: ACTIVE
```

---

## 11.2 Subject List

Admin can:

* search subjects
* filter subjects
* view subject details
* edit subjects
* activate/deactivate subjects

---

# 12. FACULTY MANAGEMENT

Admin can:

* add faculty
* edit faculty
* deactivate faculty
* activate faculty
* view faculty details
* assign subjects

Faculty fields may include:

* name
* employee ID
* email
* department
* status

---

# 13. STUDENT MANAGEMENT

The system must support student records.

Student fields:

* student ID
* name
* email
* enrollment/roll number
* semester
* department
* status

Faculty should be able to add students to their practical session/class where permitted.

---

# 14. FACULTY DASHBOARD

Faculty dashboard should clearly show:

* assigned subjects
* active practical sessions
* total students
* pending submissions
* submitted work
* late submissions
* upcoming deadlines
* recently graded submissions
* basic student performance overview

The dashboard should prioritize actionable information.

---

# 15. PRACTICAL SESSION

A Practical Session represents a practical/laboratory class for a subject.

Example:

```text
Subject:
Data Structures

Session:
DS Practical Session

Faculty:
Prof. XYZ

Semester:
3

Batch:
A

Students:
60
```

Session fields:

```text
id
subjectId
facultyId
name
description
semester
batch
startDate
endDate
status
createdAt
updatedAt
```

Possible status:

```text
DRAFT
ACTIVE
COMPLETED
ARCHIVED
```

---

# 16. SESSION MANAGEMENT

Faculty must be able to:

* create session
* edit session
* activate session
* close session
* archive session
* add/remove students
* view session students
* create tasks inside session

---

# 17. PRACTICAL TASK

A practical task represents one practical assignment.

Example:

```text
Practical 01

Title:
Implement Binary Search Tree

Subject:
Data Structures

Maximum Marks:
10

Deadline:
15 October 2026, 11:59 PM
```

Task fields:

```text
id
sessionId
title
description
instructions
maximumMarks
deadline
createdAt
updatedAt
status
```

Possible status:

```text
DRAFT
PUBLISHED
CLOSED
```

---

# 18. TASK INSTRUCTIONS

Faculty must be able to provide detailed instructions.

Instructions may include:

* objective
* problem statement
* requirements
* expected output
* submission format
* file naming convention
* evaluation criteria
* additional notes

The student must see these instructions before submitting.

---

# 19. REFERENCE MATERIALS

Each practical task may contain reference material.

Supported materials may include:

* PDF
* DOC/DOCX
* PPT/PPTX
* images
* text documents
* example files

Faculty can:

* upload resource
* replace resource
* delete resource
* view resource
* associate resource with a task

Students can:

* view resources
* download resources

Reference material is informational only.

It is NOT an AI/RAG source in the current version.

---

# 20. DEADLINES

Every task may have a deadline.

The system must store the exact deadline.

The UI should clearly display:

* deadline date
* deadline time
* time remaining
* submission status

Statuses:

```text
UPCOMING
DUE_SOON
DUE_TODAY
MISSED
SUBMITTED
SUBMITTED_LATE
```

---

# 21. STUDENT TASK VIEW

When a student opens a task, the page should display:

1. Subject
2. Session
3. Task title
4. Task description
5. Instructions
6. Maximum marks
7. Deadline
8. Reference materials
9. Submission requirements
10. Current saved work
11. Submission status
12. Submission timestamp
13. Grade
14. Faculty remarks

---

# 22. FILE UPLOADS

Students must be able to upload practical files.

Possible file types:

```text
PDF
DOC
DOCX
PPT
PPTX
TXT
ZIP
PNG
JPG
JPEG
CSV
SOURCE CODE FILES
```

The exact allowed types should be configurable.

The system must validate:

* file type
* file size
* file integrity

Never trust only the file extension.

---

# 23. FILE STORAGE

Uploaded files must have a structured storage system.

Recommended conceptual structure:

```text
/uploads
    /subjects
        /{subjectId}
            /sessions
                /{sessionId}
                    /tasks
                        /{taskId}
                            /students
                                /{studentId}
```

Do not expose raw storage paths unnecessarily.

Files should be accessed through authorized backend endpoints.

---

# 24. STUDENT SUBMISSION

A submission belongs to:

```text
student
+
task
```

A submission should contain:

```text
id
taskId
studentId
status
submittedAt
createdAt
updatedAt
```

Possible status:

```text
DRAFT
SUBMITTED
LATE
GRADED
```

---

# 25. SUBMISSION VERSIONING

The system should preferably preserve submission history.

If a student uploads a new version before the deadline:

```text
Version 1
Version 2
Version 3
```

The system should know:

* which version is latest
* when each version was uploaded
* whether the final submission was submitted
* who uploaded it

Do not silently overwrite historical submission information if version history is implemented.

---

# 26. AUTOSAVE

Autosave is an important requirement.

The platform should save student work periodically where the workflow supports editable data.

Autosave should:

* happen automatically
* prevent unnecessary data loss
* show last saved time
* avoid excessive server requests

Example:

```text
Saved automatically at 10:42:17 PM
```

Important:

File uploads themselves should not be treated as continuous autosave.

Autosave should primarily apply to:

* text fields
* notes
* practical work metadata
* draft submission state

---

# 27. FINAL SUBMISSION

Student must explicitly submit the practical.

Before final submission:

Display:

```text
You are about to submit this practical.

After submission, editing may be restricted depending on the task configuration.

Continue?
```

The exact edit policy should be configurable.

---

# 28. SUBMISSION DEADLINE LOGIC

The backend must determine whether a submission is:

### On time

```text
submittedAt <= deadline
```

### Late

```text
submittedAt > deadline
```

Never rely on the student's device clock.

Use server time.

---

# 29. MISSED SUBMISSIONS

If a student has not submitted by the deadline:

The task should appear as:

```text
MISSED
```

The system should NOT fabricate a submission.

The platform should clearly distinguish:

```text
NOT SUBMITTED
SUBMITTED ON TIME
SUBMITTED LATE
GRADED
```

---

# 30. NOTIFICATIONS

The current version may implement basic deadline notifications.

Students should be informed about:

* upcoming deadlines
* deadline approaching
* missed deadlines
* newly published tasks
* grading completion

Notification channels may initially be:

* in-app notifications
* email notifications if email infrastructure is configured

Do not introduce unnecessary third-party notification infrastructure unless required.

---

# 31. STUDENT DASHBOARD

The student dashboard should provide a simple overview.

Display:

### Subjects

Example:

```text
Data Structures
Database Management System
Operating Systems
Computer Networks
```

### Upcoming Tasks

Example:

```text
BST Implementation
Due: 15 Oct 2026
```

### Pending Tasks

### Submitted Tasks

### Missed Tasks

### Recently Graded

### Overall Performance

---

# 32. STUDENT TASK STATUS UI

Use clear visual states.

Example:

```text
Not Started
In Progress
Submitted
Submitted Late
Graded
Missed
```

Do not depend only on colors.

Use:

* labels
* icons
* text
* status badges

This improves accessibility.

---

# 33. FACULTY SUBMISSION MANAGEMENT

Faculty should have a centralized submission page.

For a task:

```text
Task: Binary Search Tree

Students: 60

Submitted: 52
Pending: 5
Late: 3
Graded: 48
```

Faculty should be able to filter by:

* all
* submitted
* pending
* late
* graded
* ungraded

---

# 34. FACULTY GRADING

Faculty should be able to open a student's submission.

Display:

```text
Student Name
Roll Number
Task
Submission Time
Status
Uploaded Files
```

Faculty can enter:

```text
Marks
Remarks
```

Example:

```text
Marks: 8 / 10

Remarks:
Implementation is correct.
Improve code documentation.
```

---

# 35. MARK VALIDATION

The system must validate:

```text
marks >= 0
marks <= maximumMarks
```

The backend MUST perform this validation.

Do not rely only on frontend validation.

---

# 36. GRADE EDITING

Faculty may update marks and remarks according to permissions.

The system should maintain:

* previous marks
* new marks
* updatedBy
* updatedAt

If an audit system is implemented, grade changes should be recorded.

---

# 37. STUDENT GRADE VIEW

Students can view:

```text
Task
Maximum Marks
Marks Obtained
Percentage
Faculty Remarks
Submission Status
```

Students must NOT be able to edit marks or remarks.

---

# 38. SUBJECT PERFORMANCE

For each subject, calculate basic performance.

Example:

```text
Subject:
Data Structures

Tasks:
10

Completed:
9

Pending:
1

Average:
7.8 / 10

Submission Rate:
90%
```

Only use actual stored data.

Do not invent performance data.

---

# 39. MONTHLY REPORT

Monthly reporting is a CORE MVP FEATURE.

The platform should generate a monthly student performance report.

Example:

```text
Student Monthly Report

Student:
Rudra Patel

Roll No:
24CS075

Month:
October 2026
```

Report should contain:

### Attendance/Session Activity

Only if attendance/activity data actually exists.

Do not fabricate attendance.

### Practical Tasks

```text
Total Tasks
Submitted
Pending
Late
Graded
```

### Marks

```text
Total Marks
Marks Obtained
Average
Percentage
```

### Subject-wise Performance

Example:

```text
Data Structures       82%
Database Systems      76%
Operating Systems     88%
```

### Submission Behaviour

```text
On-time submissions
Late submissions
Missed submissions
```

### Faculty Remarks

Include available faculty remarks where appropriate.

---

# 40. MONTHLY REPORT GENERATION

Reports must be generated from database records.

The report period should be explicit.

Example:

```text
01 October 2026
to
31 October 2026
```

The system must not accidentally mix data from other months.

---

# 41. REPORT FILTERS

Faculty should be able to select:

* month
* year
* subject
* session
* student
* batch

Admin may have broader access.

Students should only see their own reports.

---

# 42. REPORT EXPORT

Prefer supporting:

```text
PDF
CSV
```

where practical.

If PDF generation is implemented:

The report should be professional and readable.

Include:

* institution/platform title
* student information
* reporting period
* summary
* subject performance
* submission statistics
* marks
* remarks

---

# 43. FACULTY CLASS REPORT

Faculty should be able to view a class-level report.

Example:

```text
Class Performance

Students: 60

Average Marks: 7.4 / 10
Submission Rate: 91%
Late Submission Rate: 12%
Missed Submission Rate: 9%
```

Also show student-level rows:

```text
Student | Submitted | Late | Missed | Average | Status
```

---

# 44. STUDENT PERFORMANCE INDICATORS

The system can identify basic rule-based indicators.

For example:

```text
LOW PERFORMANCE
HIGH MISSED SUBMISSIONS
HIGH LATE SUBMISSIONS
```

These MUST be based on transparent rules.

Do NOT use AI.

Example rule:

```text
If average < 40%:
LOW PERFORMANCE
```

Such thresholds should ideally be configurable.

---

# 45. DASHBOARD PRINCIPLES

Dashboards must not become overloaded.

Information hierarchy:

### Student

1. Upcoming deadlines
2. Pending tasks
3. Submission status
4. Grades
5. Reports

### Faculty

1. Pending submissions
2. Upcoming deadlines
3. Ungraded work
4. Student performance
5. Reports

### Admin

1. Subjects
2. Faculty
3. Students
4. Sessions
5. Platform overview

---

# 46. UI/UX PRINCIPLES

The application must be:

* clean
* modern
* responsive
* professional
* academic
* easy to understand
* fast
* accessible

Avoid unnecessary animations.

Avoid excessive cards.

Avoid visual clutter.

---

# 47. NAVIGATION

## Admin

```text
Dashboard
Subjects
Faculty
Students
Reports
Settings
```

## Faculty

```text
Dashboard
Subjects
Sessions
Tasks
Submissions
Students
Reports
Notifications
Profile
```

## Student

```text
Dashboard
Subjects
Tasks
Submissions
Grades
Reports
Notifications
Profile
```

Navigation must only show options the current role is allowed to use.

---

# 48. CORE PAGE REQUIREMENTS

## Admin Pages

```text
/admin/dashboard
/admin/subjects
/admin/subjects/create
/admin/subjects/:id
/admin/faculty
/admin/faculty/create
/admin/students
/admin/reports
```

---

## Faculty Pages

```text
/faculty/dashboard
/faculty/subjects
/faculty/sessions
/faculty/sessions/create
/faculty/sessions/:id
/faculty/sessions/:id/students
/faculty/sessions/:id/tasks
/faculty/tasks/:id
/faculty/tasks/:id/submissions
/faculty/submissions/:id
/faculty/students
/faculty/reports
```

---

## Student Pages

```text
/student/dashboard
/student/subjects
/student/subjects/:id
/student/tasks
/student/tasks/:id
/student/tasks/:id/submit
/student/submissions
/student/submissions/:id
/student/grades
/student/reports
/student/notifications
```

These routes are conceptual.

Adapt them to the selected framework if necessary, but preserve the same logical functionality.

---

# 49. API DESIGN

Use RESTful APIs or another consistent API architecture.

Example:

## Authentication

```http
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

## Subjects

```http
GET /api/subjects
POST /api/subjects
GET /api/subjects/:id
PATCH /api/subjects/:id
DELETE /api/subjects/:id
```

## Faculty

```http
GET /api/faculty
POST /api/faculty
GET /api/faculty/:id
PATCH /api/faculty/:id
```

## Students

```http
GET /api/students
POST /api/students
GET /api/students/:id
PATCH /api/students/:id
```

## Sessions

```http
GET /api/sessions
POST /api/sessions
GET /api/sessions/:id
PATCH /api/sessions/:id
DELETE /api/sessions/:id
```

## Tasks

```http
GET /api/tasks
POST /api/tasks
GET /api/tasks/:id
PATCH /api/tasks/:id
DELETE /api/tasks/:id
```

## Submissions

```http
POST /api/tasks/:taskId/submissions
GET /api/tasks/:taskId/submissions
GET /api/submissions/:id
PATCH /api/submissions/:id
```

## Grading

```http
POST /api/submissions/:id/grade
PATCH /api/submissions/:id/grade
```

## Reports

```http
GET /api/reports/student/:studentId/monthly
GET /api/reports/class/:sessionId/monthly
```

These are logical examples.

Do not create duplicate APIs with conflicting responsibilities.

---

# 50. DATABASE MODEL

The database should have a clean relational structure.

Recommended core entities:

```text
User
Student
Faculty
Subject
FacultySubject
PracticalSession
SessionStudent
Task
TaskResource
Submission
SubmissionFile
Grade
Notification
MonthlyReport
AuditLog
```

Depending on architecture, Student and Faculty may extend User or reference User.

---

# 51. RELATIONSHIPS

Conceptual relationship:

```text
User
 |
 +---- Student
 |
 +---- Faculty
 |
 +---- Admin


Subject
 |
 +---- PracticalSession
 |
 +---- FacultySubject


PracticalSession
 |
 +---- SessionStudent
 |
 +---- Task


Task
 |
 +---- TaskResource
 |
 +---- Submission


Submission
 |
 +---- SubmissionFile
 |
 +---- Grade
```

---

# 52. DATA INTEGRITY

The database must enforce:

* unique user emails
* unique student IDs
* unique faculty IDs
* valid foreign keys
* valid task ownership
* valid session ownership
* valid grades
* valid submission relationships

Avoid orphan records.

---

# 53. DELETE POLICY

Avoid hard deletion when academic records should be preserved.

Prefer:

```text
ACTIVE
INACTIVE
ARCHIVED
```

for entities such as:

* users
* subjects
* sessions
* tasks

Academic submissions and grades should generally not be casually deleted.

---

# 54. AUDITABILITY

Important actions should be traceable.

Examples:

```text
Who created the task?
Who changed the deadline?
Who graded the submission?
Who changed the grade?
When was the submission uploaded?
When was it submitted?
```

Audit logs may contain:

```text
id
userId
action
entityType
entityId
metadata
timestamp
```

---

# 55. SECURITY

The platform handles academic records.

Therefore:

* validate all inputs
* sanitize user-generated content
* protect authenticated routes
* enforce authorization server-side
* validate uploads
* limit file sizes
* prevent path traversal
* prevent unauthorized file access
* protect against SQL injection
* protect against XSS
* use secure password hashing
* use secure sessions/tokens
* do not expose sensitive database information

Never trust client-provided:

```text
studentId
facultyId
role
marks
submission status
timestamps
```

where the server can determine the correct value.

---

# 56. FILE SECURITY

Uploaded files must not automatically become publicly accessible.

A student should only access:

* their own submissions
* resources assigned to them

Faculty should only access:

* submissions belonging to their authorized sessions/tasks

Admin access should follow administrative permissions.

---

# 57. ERROR HANDLING

Errors must be understandable.

Bad:

```text
500 Internal Server Error
```

when a useful message can be returned.

Better:

```text
Unable to submit the practical because the deadline has passed.
```

However, never expose:

* stack traces
* database credentials
* internal server paths
* secrets

to end users.

---

# 58. EMPTY STATES

Every list must have an appropriate empty state.

Example:

```text
No pending submissions.

All students have submitted this task.
```

For students:

```text
No upcoming practicals.

You're all caught up.
```

---

# 59. LOADING STATES

Use proper loading indicators.

Do not show blank screens while data is loading.

---

# 60. FORM VALIDATION

All forms must validate:

* required fields
* character limits
* valid dates
* valid numeric values
* file types
* file sizes

Frontend validation improves UX.

Backend validation is mandatory.

---

# 61. DEADLINE EDGE CASES

Handle:

* task with no deadline
* deadline in the past
* deadline exactly now
* submission exactly at deadline
* late submission
* task closed
* student removed from session
* faculty changing deadline

The server is authoritative for time.

---

# 62. GRADING EDGE CASES

Handle:

* zero marks
* full marks
* decimal marks if configured
* invalid marks
* grade editing
* ungraded submission
* graded submission
* missing submission

---

# 63. SUBMISSION EDGE CASES

Handle:

* no file
* invalid file
* oversized file
* duplicate filename
* multiple files
* replacing files
* upload failure
* partial upload
* network interruption
* retry
* submission after deadline

---

# 64. REPORT EDGE CASES

Handle:

* no submissions
* no grades
* no tasks
* student enrolled mid-month
* task created mid-month
* task deadline in another month
* late submission
* incomplete grading

Reports must accurately reflect available data.

Never turn missing data into zero without clearly defining that behavior.

---

# 65. MONTHLY REPORT CALCULATION

Define calculations clearly.

For example:

```text
Submission Rate =
Submitted Tasks / Assigned Tasks × 100
```

```text
Late Submission Rate =
Late Submissions / Submitted Tasks × 100
```

```text
Average Percentage =
Average of task percentages
```

Do not confuse:

```text
average marks
```

with:

```text
percentage
```

---

# 66. PERFORMANCE REPORT EXAMPLE

A student report could contain:

```text
==================================================
SMARTLAB MONTHLY PERFORMANCE REPORT
==================================================

Student:
Rudra Patel

Roll Number:
24CS075

Month:
October 2026

--------------------------------------------------
SUMMARY
--------------------------------------------------

Assigned Tasks: 20
Submitted: 18
Late: 2
Missed: 0
Graded: 17

Average Score: 78%

--------------------------------------------------
SUBJECT PERFORMANCE
--------------------------------------------------

Data Structures        82%
Database Systems       74%
Operating Systems      79%

--------------------------------------------------
SUBMISSION PERFORMANCE
--------------------------------------------------

On Time: 16
Late: 2
Missed: 0

--------------------------------------------------
FACULTY REMARKS
--------------------------------------------------

"Good practical performance.
Improve documentation consistency."

==================================================
```

---

# 67. SEARCH

Where useful, provide search.

Examples:

Admin:

* search student
* search faculty
* search subject

Faculty:

* search student
* search task
* search submission

Do not make search unnecessarily complex.

---

# 68. FILTERING

Filtering should be available where lists become large.

Examples:

```text
Status
Subject
Session
Date
Submission Status
Grade Status
```

---

# 69. PAGINATION

Large datasets should use pagination.

Do not load thousands of records unnecessarily.

Examples:

* students
* submissions
* notifications
* audit logs

---

# 70. SCALABILITY

The platform should be designed to support approximately:

```text
1000+ concurrent students
```

and potentially more users in the future.

Avoid:

* loading every student into the browser
* loading every submission at once
* N+1 database queries
* unbounded API responses
* unnecessarily large payloads

Use:

* pagination
* indexing
* efficient queries
* caching where appropriate
* asynchronous processing for heavy operations

---

# 71. PERFORMANCE

Important pages should load quickly.

Optimize:

* database queries
* API response size
* file operations
* frontend rendering
* image loading
* report generation

Do not sacrifice correctness for micro-optimizations.

---

# 72. CONCURRENCY

Multiple users may interact with the system simultaneously.

Examples:

* 60 students submitting at once
* faculty grading while students upload
* many students accessing resources
* monthly report generation

The system should handle concurrent operations safely.

---

# 73. TRANSACTIONS

Use database transactions where multiple related changes must succeed together.

Example:

Creating a submission may involve:

```text
Submission
+
SubmissionFile
+
Status
```

Do not leave partially-created records when an operation fails.

---

# 74. NOTIFICATION ARCHITECTURE

Notifications should have:

```text
id
userId
type
title
message
read
createdAt
```

Possible types:

```text
TASK_CREATED
DEADLINE_REMINDER
DEADLINE_MISSED
SUBMISSION_GRADED
GENERAL
```

---

# 75. UI NOTIFICATION CENTER

Users should have a notification page/dropdown.

Example:

```text
2 hours ago
Your Data Structures practical is due tomorrow.

Yesterday
Your DBMS Practical 04 has been graded.
```

Unread notifications should be visually identifiable.

---

# 76. DESIGN SYSTEM

Use a consistent design system.

Components should include:

* Button
* Input
* Select
* Modal
* Dialog
* Card
* Table
* Badge
* Alert
* Toast
* Tabs
* Dropdown
* File uploader
* Date picker
* Pagination
* Loading skeleton

Do not recreate the same UI component differently on every page.

---

# 77. TABLE DESIGN

Tables should be responsive.

Example faculty submission table:

| Student   | Roll No | Status    | Submitted | Marks | Action |
| --------- | ------- | --------- | --------- | ----- | ------ |
| Student A | 24CS001 | Submitted | 10 Oct    | 8/10  | Review |
| Student B | 24CS002 | Pending   | —         | —     | View   |
| Student C | 24CS003 | Late      | 11 Oct    | 6/10  | Review |

---

# 78. STUDENT TASK CARD

Example:

```text
Data Structures

Practical 05
Binary Search Tree

Due:
15 Oct 2026, 11:59 PM

Status:
In Progress

Maximum Marks:
10

[Open Practical]
```

---

# 79. FACULTY TASK CARD

Example:

```text
Practical 05
Binary Search Tree

Students: 60

Submitted: 54
Pending: 4
Late: 2

Graded: 50

[Manage Task]
[View Submissions]
```

---

# 80. NO FAKE FUNCTIONALITY

Do not create buttons that do nothing.

Do not create fake AI buttons.

Do not create fake analytics.

Do not create fake report data.

If a feature is not implemented, do not pretend it is implemented.

---

# 81. NO PLACEHOLDER LOGIC IN CORE FEATURES

Core MVP functionality must be real.

Especially:

* authentication
* database operations
* subjects
* sessions
* tasks
* uploads
* submissions
* grading
* reports

---

# 82. NO HARDCODED ACADEMIC DATA

Do not hardcode:

```text
students
subjects
faculty
grades
tasks
reports
```

Use the database.

Seed data may be provided for development only.

---

# 83. DEVELOPMENT SEED DATA

Create development seed data if useful.

Example:

```text
1 Admin
3 Faculty
20 Students
3 Subjects
3 Sessions
10 Tasks
```

Clearly mark seed data as development data.

---

# 84. API RESPONSE FORMAT

Use a consistent response format.

Example success:

```json
{
  "success": true,
  "data": {},
  "message": "Task created successfully"
}
```

Example error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Deadline is required"
  }
}
```

Maintain consistency throughout the API.

---

# 85. LOGGING

Backend logs should help developers diagnose problems.

Log:

* errors
* important operations
* unexpected failures

Do NOT log:

* passwords
* tokens
* secrets
* sensitive uploaded content unnecessarily

---

# 86. TESTING

Implement tests for critical functionality.

Minimum areas:

### Authentication

* login success
* login failure
* unauthorized access

### Authorization

* student cannot access admin APIs
* faculty cannot access unauthorized sessions
* student cannot edit grades

### Tasks

* task creation
* task editing
* deadline validation

### Submission

* file upload
* submission
* late submission
* invalid file

### Grading

* valid marks
* invalid marks
* grade visibility

### Reports

* monthly calculation
* subject filtering
* empty reports

---

# 87. TESTING PHILOSOPHY

Do not only test the happy path.

Test:

```text
empty data
invalid data
unauthorized data
late data
duplicate data
large data
concurrent operations
```

---

# 88. DATABASE INDEXING

Add indexes to frequently queried fields.

Potential indexes:

```text
User.email
Student.studentId
Faculty.employeeId
Task.deadline
Submission.studentId
Submission.taskId
Notification.userId
Notification.createdAt
```

Choose indexes based on actual query patterns.

---

# 89. API SECURITY

Every endpoint must answer:

1. Who is calling?
2. Are they authenticated?
3. What role do they have?
4. Are they allowed to access this resource?
5. Are the submitted values valid?

---

# 90. RESOURCE OWNERSHIP

Never assume:

```text
/api/submissions/123
```

means the current user can access submission 123.

The server must verify ownership/authorization.

---

# 91. FILE DOWNLOAD AUTHORIZATION

When downloading a file:

```text
GET /api/files/:id
```

the backend must check whether the requesting user has permission.

Never expose private academic files through predictable public URLs.

---

# 92. DATABASE TRANSACTION EXAMPLE

When grading:

```text
BEGIN TRANSACTION

Validate submission
Validate faculty permission
Validate marks
Create/update grade
Create audit record

COMMIT
```

If any critical operation fails:

```text
ROLLBACK
```

---

# 93. ARCHITECTURE

Use a clean architecture.

Recommended logical layers:

```text
Frontend
    ↓
API / Controller
    ↓
Service Layer
    ↓
Repository / ORM
    ↓
Database
```

File storage should be treated as a separate infrastructure service.

---

# 94. FRONTEND RESPONSIBILITIES

Frontend handles:

* UI
* navigation
* forms
* validation for UX
* loading states
* error presentation
* file selection
* dashboards
* tables
* charts
* report viewing

Frontend must NOT be trusted for authorization.

---

# 95. BACKEND RESPONSIBILITIES

Backend handles:

* authentication
* authorization
* business rules
* database access
* file access
* grade validation
* deadline validation
* report calculations
* notification generation

---

# 96. DATABASE RESPONSIBILITIES

Database handles:

* persistence
* relationships
* constraints
* indexes
* transactions

---

# 97. FILE STORAGE RESPONSIBILITIES

File storage handles:

* uploaded practical files
* reference materials
* report files if generated

The application should store metadata in the database.

---

# 98. FILE METADATA

A file record should contain information such as:

```text
id
originalName
storedName
mimeType
size
storageKey
uploadedBy
createdAt
```

Never rely solely on the original filename.

---

# 99. DEADLINE REMINDER STRATEGY

The system may generate reminders such as:

```text
7 days before
3 days before
1 day before
same day
```

The exact schedule should be configurable.

Do not spam students.

---

# 100. REMINDER IDEMPOTENCY

Do not send the same reminder repeatedly due to repeated cron execution.

Track whether a reminder has already been generated/sent.

---

# 101. BACKGROUND JOBS

Background jobs may be used for:

* deadline reminders
* monthly report generation
* email notifications
* large report exports

Do not block normal HTTP requests with heavy processing.

---

# 102. MONTHLY REPORT JOB

If reports are generated automatically:

At the start of a new month, the system may generate the previous month's report.

Example:

```text
November 1
↓
Generate October report
```

However, reports should also be available on demand.

---

# 103. REPORT SNAPSHOT

If reports are stored as historical documents, make clear whether they represent:

```text
live calculated data
```

or:

```text
snapshot data at generation time
```

Prefer deterministic behavior.

---

# 104. DATA CONSISTENCY

If a grade changes after a monthly report was generated, decide whether:

* the report dynamically recalculates
  OR
* the report remains a historical snapshot.

Document and implement one consistent policy.

Recommended MVP approach:

```text
Reports are dynamically generated from current database data.
```

Historical PDF snapshots may be generated separately.

---

# 105. STUDENT PRIVACY

Students must only see their own:

* submissions
* marks
* remarks
* reports
* notifications

Students must never see another student's academic records.

---

# 106. FACULTY PRIVACY

Faculty should only access students and submissions associated with their authorized subjects/sessions.

---

# 107. ADMIN ACCESS

Admin has broader management privileges but should still follow proper access controls.

---

# 108. AUDIT EVENTS

Potential audit events:

```text
USER_CREATED
SUBJECT_CREATED
SESSION_CREATED
TASK_CREATED
TASK_UPDATED
DEADLINE_CHANGED
SUBMISSION_CREATED
SUBMISSION_UPDATED
GRADE_CREATED
GRADE_UPDATED
FILE_UPLOADED
FILE_DELETED
```

---

# 109. FUTURE AI EXTENSION POINTS

Although AI is not implemented now, the architecture should allow future services such as:

```text
PlagiarismService
CodeSimilarityService
AIGradingService
RAGService
VivaGeneratorService
AIProductivityService
```

These must be conceptual extension points only.

Do NOT implement them in the MVP.

---

# 110. FUTURE RAG ARCHITECTURE

The future RAG system may consume:

* CHARUSAT syllabus
* practical documents
* faculty resources
* reference material

But no vector database or embedding pipeline should be implemented now.

---

# 111. FUTURE PLAGIARISM ARCHITECTURE

Future plagiarism functionality may analyze:

```text
student submission
        ↓
normalization
        ↓
similarity analysis
        ↓
similarity score
        ↓
faculty review
```

Again:

DO NOT IMPLEMENT THIS NOW.

---

# 112. FUTURE AI GRADING ARCHITECTURE

Future:

```text
Submission
↓
Rule-based checks
↓
Similarity checks
↓
AI analysis
↓
Suggested marks
↓
Faculty approval
```

The faculty should remain the final authority.

This is future functionality only.

---

# 113. FUTURE VIVA ARCHITECTURE

Future:

```text
Subject
↓
CHARUSAT syllabus
↓
RAG
↓
Relevant practical
↓
Viva questions
↓
Student answers
↓
Evaluation
```

Do not implement now.

---

# 114. IMPORTANT SCOPE RULE

When uncertain whether a feature belongs to the MVP:

ASK:

> Does this directly support practical submission, grading, deadline management, or monthly reporting?

If NO:

Do not implement it unless explicitly required.

---

# 115. FEATURE PRIORITY

## P0 — MUST HAVE

```text
Authentication
Role-based access
Admin
Faculty
Student
Subjects
Sessions
Tasks
Deadlines
File uploads
Submissions
Grading
Remarks
Student grade view
Submission status
Monthly reports
```

## P1 — SHOULD HAVE

```text
Notifications
Reference materials
Autosave
Submission versioning
Audit logs
PDF reports
CSV exports
Search
Filtering
Pagination
```

## P2 — FUTURE

```text
Plagiarism detection
AI grading
RAG
AI viva
AI analytics
AI productivity
Predictive analytics
```

---

# 116. MVP ACCEPTANCE CRITERIA

The MVP is considered functional when the following complete workflow works:

## Step 1

Admin logs in.

## Step 2

Admin creates:

```text
Subject
Faculty
Students
```

## Step 3

Faculty logs in.

## Step 4

Faculty creates a practical session.

## Step 5

Faculty adds students.

## Step 6

Faculty creates a task.

## Step 7

Faculty enters:

```text
Title
Description
Instructions
Maximum Marks
Deadline
```

## Step 8

Faculty uploads reference material.

## Step 9

Student logs in.

## Step 10

Student sees the session and task.

## Step 11

Student opens the practical.

## Step 12

Student views instructions and resources.

## Step 13

Student uploads practical files.

## Step 14

Student submits the task.

## Step 15

System records submission time.

## Step 16

Faculty sees the submission.

## Step 17

Faculty opens uploaded files.

## Step 18

Faculty assigns:

```text
Marks
Remarks
```

## Step 19

Student sees:

```text
Marks
Remarks
Submission status
```

## Step 20

Monthly report shows:

```text
Tasks
Submissions
Late submissions
Missed submissions
Marks
Average
Subject performance
Remarks
```

If this workflow works reliably, the MVP is fundamentally complete.

---

# 117. EXAMPLE COMPLETE USER JOURNEY

## Faculty

```text
Login
↓
Dashboard
↓
Select Data Structures
↓
Open Practical Session
↓
Create Practical 01
↓
Add instructions
↓
Set deadline
↓
Upload reference PDF
↓
Publish
↓
Students receive task
↓
Students submit
↓
Faculty opens submissions
↓
Reviews files
↓
Assigns 8/10
↓
Adds remark
↓
Save
↓
Student receives notification
```

---

# 118. STUDENT JOURNEY

```text
Login
↓
Dashboard
↓
See upcoming practical
↓
Open task
↓
Read instructions
↓
Open reference material
↓
Prepare practical
↓
Upload files
↓
Save draft
↓
Submit
↓
Submission confirmed
↓
Wait for grading
↓
Receive grade
↓
View remarks
↓
Monthly report updated
```

---

# 119. ADMIN JOURNEY

```text
Login
↓
Dashboard
↓
Create Subject
↓
Create Faculty
↓
Create/Manage Students
↓
Assign academic structure
↓
Monitor platform
```

---

# 120. SUBMISSION CONFIRMATION

After successful submission, show:

```text
Submission Successful

Task:
Data Structures Practical 05

Submitted:
10 October 2026, 8:42 PM

Status:
Submitted On Time

Files:
2

You can view your submission from the Submissions section.
```

---

# 121. GRADE CONFIRMATION

After faculty grades:

```text
Submission Graded

Task:
Data Structures Practical 05

Marks:
8 / 10

Remark:
Good implementation. Improve documentation.
```

---

# 122. MONTHLY REPORT UI

The report page should contain:

```text
------------------------------------------------
October 2026 Performance
------------------------------------------------

Overall Score
78%

Tasks
20

Submitted
18

Late
2

Missed
0

------------------------------------------------
Subject Performance
------------------------------------------------

Data Structures       82%
DBMS                   74%
Operating Systems      79%

------------------------------------------------
Submission Activity
------------------------------------------------

On Time               16
Late                   2
Missed                  0

------------------------------------------------
Faculty Feedback
------------------------------------------------
...
```

---

# 123. RESPONSIVE DESIGN

The application must work on:

* desktop
* laptop
* tablet
* mobile

However, the primary target is desktop/laptop because practical work is commonly performed in college computer labs.

---

# 124. ACCESSIBILITY

Support:

* keyboard navigation
* visible focus states
* readable typography
* sufficient contrast
* semantic HTML
* accessible form labels
* meaningful error messages

Do not communicate information only through color.

---

# 125. FRONTEND STATE MANAGEMENT

Use a predictable state management strategy.

Avoid unnecessary global state.

Server state should be handled using appropriate data-fetching patterns.

Do not duplicate the same data unnecessarily.

---

# 126. API CACHING

Cache only data that is safe to cache.

Be careful with:

* grades
* submissions
* permissions
* deadlines

Freshness matters for these.

---

# 127. FILE UPLOAD UX

Upload UI should display:

```text
Filename
File size
Upload progress
Success/failure
Remove
Retry
```

Example:

```text
BST_Practical.pdf
2.4 MB
Uploading... 72%
```

---

# 128. MULTIPLE FILES

A task may allow:

```text
1 file
```

or:

```text
multiple files
```

The task configuration should ideally support this.

Example:

```text
Maximum files: 5
Maximum total size: 50 MB
```

---

# 129. SUBMISSION FORMAT

Faculty should be able to specify requirements.

Example:

```text
Submit:
1. Source code
2. Output screenshot
3. Practical documentation PDF
```

The student should clearly see these requirements.

---

# 130. FILE NAMING

If faculty specifies a file naming convention:

Example:

```text
RollNo_PracticalNo.pdf
```

show it to students.

Automatic validation may be added later, but is not mandatory for MVP.

---

# 131. PRACTICAL DOCUMENTATION

The platform should encourage structured documentation through clear task requirements.

Do not build a complicated document editor unless explicitly required.

---

# 132. EDITING AFTER SUBMISSION

The platform should support configurable submission policy:

```text
Allow resubmission:
YES / NO
```

If YES:

Faculty may define:

```text
Resubmission deadline
```

If NO:

Student sees:

```text
Submission locked
```

---

# 133. FACULTY TASK SETTINGS

Useful fields:

```text
Maximum Marks
Deadline
Allow Late Submission
Allow Resubmission
Maximum Files
Maximum File Size
Required File Types
```

Implement only fields necessary for the MVP.

---

# 134. STATUS DEFINITIONS

Use consistent terminology.

## Task

```text
DRAFT
PUBLISHED
CLOSED
ARCHIVED
```

## Submission

```text
NOT_STARTED
DRAFT
SUBMITTED
LATE
GRADED
MISSED
```

Do not use different terminology for the same state in different parts of the application.

---

# 135. DATE/TIME

Store timestamps in a consistent server/database format.

Display them according to the institution/user timezone.

For the current deployment, the expected timezone is:

```text
Asia/Kolkata
```

Do not trust browser timestamps for academic deadlines.

---

# 136. INTERNATIONALIZATION

The system may initially use English.

Do not hardcode text into deeply coupled business logic if easy localization is possible.

---

# 137. CONFIGURATION

Use environment variables for:

```text
DATABASE_URL
AUTH_SECRET
STORAGE_CONFIG
EMAIL_CONFIG
APP_URL
```

Never commit secrets.

---

# 138. ENVIRONMENT SEPARATION

Support:

```text
development
testing
production
```

Do not use production credentials in development.

---

# 139. DATABASE MIGRATIONS

All schema changes must be migration-based.

Do not manually modify production databases.

---

# 140. BACKUPS

Production deployment should have a database backup strategy.

At minimum document:

* backup frequency
* retention
* restoration procedure

---

# 141. OBSERVABILITY

Production should ideally have:

* application logs
* database monitoring
* error tracking
* request monitoring
* storage monitoring

Do not expose monitoring information to students.

---

# 142. DOCUMENTATION REQUIREMENTS

The project should include:

```text
README.md
ARCHITECTURE.md
DATABASE.md
API.md
DEPLOYMENT.md
```

Documentation should explain actual implemented functionality.

Do not document imaginary features as implemented.

---

# 143. PROJECT STRUCTURE

Use a maintainable structure.

Example:

```text
smartlab/
│
├── frontend/
│
├── backend/
│
├── database/
│
├── docs/
│
├── uploads/
│
├── tests/
│
├── docker/
│
├── .env.example
├── README.md
└── docker-compose.yml
```

Adapt according to the chosen stack.

Do not force this exact structure if the framework has a better convention.

---

# 144. CODE QUALITY

Code must be:

* readable
* modular
* maintainable
* typed where possible
* documented where necessary
* testable

Avoid:

* giant files
* duplicated logic
* magic numbers
* hidden side effects
* unnecessary abstraction
* premature optimization

---

# 145. SERVICE DESIGN

Business logic should not be buried inside UI components.

For example:

Bad:

```text
React component
→ directly manipulates database
```

Better:

```text
React
↓
API
↓
Service
↓
Repository
↓
Database
```

---

# 146. ERROR CODES

Use predictable error codes.

Example:

```text
AUTH_REQUIRED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
DEADLINE_EXPIRED
INVALID_FILE
FILE_TOO_LARGE
SUBMISSION_NOT_ALLOWED
GRADE_INVALID
```

---

# 147. HTTP STATUS CODES

Use appropriate HTTP codes.

```text
200 OK
201 CREATED
400 BAD REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT FOUND
409 CONFLICT
422 UNPROCESSABLE ENTITY
500 INTERNAL SERVER ERROR
```

---

# 148. NO SECURITY BY UI

Never assume that hiding a button means the operation is protected.

Example:

Even if the frontend hides:

```text
Edit Grade
```

from students,

the backend must still reject:

```text
PATCH /grades/:id
```

from students.

---

# 149. PERFORMANCE TARGET

The platform should remain responsive with:

```text
1000+ students
100+ faculty
100+ subjects
thousands of tasks
hundreds of thousands of submission records
```

Design database queries accordingly.

---

# 150. IMPORTANT IMPLEMENTATION RULE

Build the system incrementally.

Recommended order:

```text
1. Project setup
2. Database
3. Authentication
4. RBAC
5. Admin
6. Subject management
7. Faculty management
8. Student management
9. Sessions
10. Tasks
11. Resources
12. File storage
13. Student submission
14. Faculty grading
15. Notifications
16. Dashboards
17. Monthly reports
18. Testing
19. Security review
20. Performance review
```

Do not attempt to build every feature in one uncontrolled implementation.

---

# 151. DEVELOPMENT MILESTONES

## MILESTONE 1

Authentication + roles.

Acceptance:

* Admin can login
* Faculty can login
* Student can login
* Protected routes work

---

## MILESTONE 2

Admin management.

Acceptance:

* subjects
* faculty
* students

work correctly.

---

## MILESTONE 3

Faculty session/task management.

Acceptance:

* faculty creates session
* faculty adds students
* faculty creates tasks
* faculty sets deadlines

---

## MILESTONE 4

Student submission.

Acceptance:

* student sees task
* student uploads files
* student submits
* status is stored

---

## MILESTONE 5

Grading.

Acceptance:

* faculty sees submissions
* faculty opens files
* faculty enters marks
* faculty enters remarks
* student sees grade

---

## MILESTONE 6

Reporting.

Acceptance:

* monthly report calculates correctly
* faculty sees class report
* student sees personal report

---

# 152. IMPORTANT DEVELOPMENT BEHAVIOR

When implementing:

1. First inspect the existing project.
2. Understand the existing architecture.
3. Do not unnecessarily rewrite working code.
4. Reuse existing components where appropriate.
5. Follow existing coding conventions.
6. Identify missing pieces.
7. Implement one module at a time.
8. Test after each major module.
9. Do not break existing functionality.

---

# 153. IF EXISTING CODE EXISTS

If you are working inside an existing SmartLab repository:

DO NOT automatically replace the project.

First inspect:

```text
package.json
README
source structure
database schema
routes
components
services
environment configuration
```

Then determine what already exists.

Preserve useful existing work.

---

# 154. IF ARCHITECTURE IS BROKEN

If the existing architecture prevents implementation:

1. Explain the issue.
2. Identify the affected components.
3. Propose the smallest safe architectural correction.
4. Implement the correction.
5. Verify existing functionality.

Do not perform unnecessary rewrites.

---

# 155. DATABASE FIRST PRINCIPLE

Academic data must have a reliable source of truth.

The database is the source of truth for:

* users
* subjects
* sessions
* tasks
* deadlines
* submissions
* grades
* remarks
* notifications
* reports

Do not maintain conflicting copies in frontend local state as authoritative data.

---

# 156. FILE STORAGE PRINCIPLE

The database stores file metadata.

Storage stores file contents.

Do not put large files directly into relational database fields unless there is a deliberate architectural reason.

---

# 157. REPORT PRINCIPLE

Reports are derived from actual academic records.

The report engine must never invent:

* grades
* submissions
* attendance
* remarks
* performance

---

# 158. STUDENT MONTHLY REPORT LOGIC

For a given month:

1. Identify tasks relevant to the reporting period.
2. Identify students assigned to those tasks.
3. Identify submissions.
4. Determine on-time/late/missed state.
5. Identify grades.
6. Calculate marks.
7. Group results by subject.
8. Generate report.

Every calculation should be deterministic.

---

# 159. FACULTY MONTHLY REPORT LOGIC

For a selected session/month:

Calculate:

```text
Total students
Total tasks
Total expected submissions
Total submissions
Total late submissions
Total missed submissions
Total graded submissions
Average marks
Submission rate
Late rate
```

Also provide student-level details.

---

# 160. REPORT FILTER EXAMPLE

Faculty:

```text
Month: October 2026
Subject: Data Structures
Session: DS-A
```

Result:

```text
Students: 60
Tasks: 8
Expected Submissions: 480
Submitted: 450
Late: 20
Missed: 10
Average Score: 76%
```

---

# 161. REPORT ACCURACY

Never calculate:

```text
Submitted = Assigned
```

unless the database confirms it.

Never calculate:

```text
Graded = Submitted
```

unless every submission is actually graded.

---

# 162. GRADE CALCULATION

For each task:

```text
percentage =
marksObtained / maximumMarks * 100
```

For multiple tasks, clearly define whether the subject average is:

### Simple average

```text
sum(task percentages) / number of tasks
```

or weighted average.

Prefer weighted average if tasks have different maximum marks:

```text
total marks obtained / total maximum marks × 100
```

Use one consistent rule.

---

# 163. MONTHLY REPORT STATUS

A report may display:

```text
COMPLETE
PARTIALLY GRADED
NO DATA
```

Example:

If 20 tasks exist but only 15 are graded:

```text
Status: Partially Graded
```

Do not misleadingly present the report as final.

---

# 164. FACULTY REMARK AGGREGATION

Do not generate AI summaries.

For MVP:

Show actual faculty remarks.

Example:

```text
Practical 02:
"Good implementation."

Practical 03:
"Improve documentation."

Practical 04:
"Output is incomplete."
```

---

# 165. NO AI SUMMARY

Do not automatically transform those remarks into:

```text
"Student needs to improve documentation."
```

unless this is simple deterministic logic explicitly implemented later.

---

# 166. BASIC ANALYTICS

Allowed:

* counts
* averages
* percentages
* trends based directly on stored data
* submission rates
* grade distributions

Not allowed:

* AI interpretation
* ML prediction
* LLM-generated insight

---

# 167. PERFORMANCE GRAPHICS

Basic charts may be used:

* marks over time
* subject-wise percentage
* submission status
* monthly trend

Charts must be generated from real data.

---

# 168. STUDENT DASHBOARD EXAMPLE

```text
Good Evening, Rudra

------------------------------------------------

Upcoming

Data Structures
Practical 05
Due in 2 days

------------------------------------------------

Your Progress

Assigned        20
Submitted       18
Pending          2
Late             1

------------------------------------------------

Average Score

78%

------------------------------------------------

Recent Grades

DBMS Practical 04      8/10
DS Practical 03        9/10
OS Practical 02        7/10

------------------------------------------------

[View Monthly Report]
```

---

# 169. FACULTY DASHBOARD EXAMPLE

```text
Good Evening, Professor

------------------------------------------------

Pending Submissions
12

Ungraded
18

Late
5

Upcoming Deadlines
3

------------------------------------------------

Data Structures

Students: 60
Submission Rate: 92%
Average Score: 78%

[Open Subject]

------------------------------------------------

Students Needing Attention

Student A
Average: 38%

Student B
Missed: 3

------------------------------------------------
```

---

# 170. ADMIN DASHBOARD EXAMPLE

```text
SmartLab Administration

Students       1240
Faculty         85
Subjects        42
Active Sessions 73

------------------------------------------------

Quick Actions

[Add Subject]
[Add Faculty]
[Manage Students]

------------------------------------------------
```

---

# 171. PRODUCT PHILOSOPHY

SmartLab should solve the practical workflow problem first.

The core philosophy is:

```text
ASSIGN
↓
PERFORM
↓
SAVE
↓
SUBMIT
↓
REVIEW
↓
GRADE
↓
REPORT
```

Everything in the MVP should support this workflow.

---

# 172. WHAT SMARTLAB IS NOT

SmartLab is NOT currently:

* an AI coding platform
* a plagiarism detector
* an AI examiner
* an LMS replacement
* a full attendance management system
* a social network
* an AI tutor
* a RAG chatbot
* a coding competition platform
* an automatic grading engine

Do not transform the project into one of these.

---

# 173. CURRENT PRIMARY VALUE PROPOSITION

The current value proposition is:

> **One centralized platform for managing practical tasks, submissions, grading, deadlines, and student monthly performance.**

---

# 174. FUTURE VALUE PROPOSITION

Eventually SmartLab may become:

> **An intelligent practical learning and evaluation platform combining structured practical work, secure submissions, AI-assisted evaluation, plagiarism detection, RAG-based viva preparation, and academic analytics.**

But that is NOT the current MVP.

---

# 175. IMPLEMENTATION PRIORITY RULE

If there is a conflict between:

```text
fancy feature
```

and:

```text
core submission reliability
```

choose:

```text
submission reliability
```

If there is a conflict between:

```text
AI feature
```

and:

```text
grading workflow
```

choose:

```text
grading workflow
```

If there is a conflict between:

```text
visual complexity
```

and:

```text
usability
```

choose:

```text
usability
```

---

# 176. DEFINITION OF DONE

A feature is NOT done merely because:

* the button exists
* the page renders
* mock data appears
* the API returns a hardcoded response

A feature is done when:

1. UI exists
2. API exists where required
3. Database integration exists
4. Authorization exists
5. Validation exists
6. Error handling exists
7. Loading state exists
8. Empty state exists
9. Real data works
10. Critical path is tested

---

# 177. AI CODING AGENT RULES

If you are an AI coding agent implementing this project:

## RULE 1

Do not forget the project scope.

## RULE 2

Do not implement future AI functionality.

## RULE 3

Do not replace real database functionality with mock data.

## RULE 4

Do not invent requirements.

## RULE 5

Do not silently change business rules.

## RULE 6

Do not weaken authorization for convenience.

## RULE 7

Do not expose private student data.

## RULE 8

Do not trust client-side validation.

## RULE 9

Do not create fake buttons.

## RULE 10

Do not mark incomplete features as complete.

---

# 178. CONTEXT CHECK BEFORE CODING

Before implementing any feature, answer internally:

```text
What problem does this solve?

Which role uses it?

What database entity does it affect?

What API is required?

What permissions are required?

What happens when it fails?

What happens when the data is empty?

What are the edge cases?

Is this MVP or future functionality?
```

Then implement.

---

# 179. CONTEXT CHECK BEFORE ADDING A NEW FEATURE

Classify every proposed feature as:

```text
MVP
P1
FUTURE
OUT OF SCOPE
```

If it is FUTURE or OUT OF SCOPE:

Do not implement it unless explicitly requested.

---

# 180. FINAL PROJECT BOUNDARY

The current SmartLab MVP is fundamentally:

```text
ADMIN
    ↓
Subjects + Faculty + Students
    ↓
FACULTY
    ↓
Sessions + Tasks + Deadlines + Resources
    ↓
STUDENT
    ↓
Practical Work + File Upload + Submission
    ↓
FACULTY
    ↓
Review + Marks + Remarks
    ↓
STUDENT
    ↓
Grades + Monthly Reports
```

This workflow is the heart of the project.

---

# 181. FINAL INSTRUCTION TO THE AI DEVELOPER

You are not being asked to build the final futuristic version of SmartLab.

You are being asked to build a solid, scalable, secure MVP that solves the immediate academic practical workflow problem.

The immediate priority is:

```text
RELIABLE PRACTICAL SUBMISSION
+
CENTRALIZED GRADING
+
DEADLINE MANAGEMENT
+
STUDENT PERFORMANCE REPORTING
```

Do not allow future AI functionality to distract from this.

Build the foundation correctly so future modules can be integrated later.

The system must be modular enough that the following can eventually be added without destroying the MVP:

```text
Plagiarism Detection
AI Evaluation
RAG
AI Viva
AI Analytics
AI Productivity Workflow
```

But those modules are explicitly deferred.

---

# 182. FINAL SUCCESS CONDITION

SmartLab MVP succeeds if a college can realistically perform this complete workflow:

```text
Admin creates subject
        ↓
Admin creates faculty
        ↓
Faculty creates practical session
        ↓
Faculty adds students
        ↓
Faculty creates practical task
        ↓
Faculty sets deadline
        ↓
Faculty uploads resources
        ↓
Students receive task
        ↓
Students perform practical
        ↓
Students upload files
        ↓
Students submit
        ↓
System tracks deadline/status
        ↓
Faculty reviews submissions
        ↓
Faculty assigns marks
        ↓
Faculty adds remarks
        ↓
Students see results
        ↓
System generates monthly performance report
```

If every part of this workflow works reliably with real database data, proper authorization, secure file handling, correct calculations, and a usable interface, the SmartLab MVP has achieved its primary objective.

# END OF MASTER SPECIFICATION

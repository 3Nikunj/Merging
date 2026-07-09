import {
  ArrowLeft,
  Building2,
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Upload,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";

import { api } from "../../services/api";
import type { Batch, BatchStudent, College } from "../../types/admin";

type StudentForm = {
  email: string;
  full_name: string;
  phone: string;
  college: string;
  department: string;
  year_of_graduation: string;
  tenth_percentage: string;
  twelfth_percentage: string;
  graduation_cgpa: string;
  backlogs: string;
  gap_years: string;
  gap_during_grad: boolean;
  roll_number: string;
  status: string;
  temporary_password: string;
};

const emptyStudentForm: StudentForm = {
  email: "",
  full_name: "",
  phone: "",
  college: "",
  department: "",
  year_of_graduation: "",
  tenth_percentage: "",
  twelfth_percentage: "",
  graduation_cgpa: "",
  backlogs: "0",
  gap_years: "0",
  gap_during_grad: false,
  roll_number: "",
  status: "active",
  temporary_password: "",
};

const studentColumns = [
  { key: "email", label: "Email", required: true, example: "student@example.com" },
  { key: "full_name", label: "Full Name", required: true, example: "Sample Student" },
  { key: "roll_number", label: "Roll Number", required: true, example: "CSE-001" },
  { key: "college", label: "College", required: false, example: "AiValytics Institute" },
  { key: "department", label: "Department", required: false, example: "Computer Science" },
  { key: "year_of_graduation", label: "Graduation Year", required: false, example: "2027" },
  { key: "phone", label: "Phone", required: false, example: "9876543210" },
  { key: "tenth_percentage", label: "10th Percentage", required: false, example: "88" },
  { key: "twelfth_percentage", label: "12th Percentage", required: false, example: "86" },
  { key: "graduation_cgpa", label: "Graduation CGPA", required: false, example: "8.4" },
  { key: "backlogs", label: "Backlogs", required: false, example: "0" },
  { key: "gap_years", label: "Gap Years", required: false, example: "0" },
  { key: "gap_during_grad", label: "Gap During Graduation", required: false, example: "false" },
  { key: "status", label: "Status", required: false, example: "active" },
  { key: "temporary_password", label: "Temporary Password", required: false, example: "TempPass123" },
] as const;

const headerAliases: Record<string, keyof StudentForm> = {
  email: "email",
  "email address": "email",
  full_name: "full_name",
  "full name": "full_name",
  name: "full_name",
  roll_number: "roll_number",
  "roll number": "roll_number",
  roll: "roll_number",
  "registration number": "roll_number",
  college: "college",
  institution: "college",
  department: "department",
  branch: "department",
  year: "year_of_graduation",
  graduation_year: "year_of_graduation",
  "graduation year": "year_of_graduation",
  year_of_graduation: "year_of_graduation",
  phone: "phone",
  mobile: "phone",
  tenth_percentage: "tenth_percentage",
  "10th percentage": "tenth_percentage",
  "10th %": "tenth_percentage",
  twelfth_percentage: "twelfth_percentage",
  "12th percentage": "twelfth_percentage",
  "12th %": "twelfth_percentage",
  graduation_cgpa: "graduation_cgpa",
  cgpa: "graduation_cgpa",
  backlogs: "backlogs",
  gap_years: "gap_years",
  "gap years": "gap_years",
  gap_during_grad: "gap_during_grad",
  "gap during graduation": "gap_during_grad",
  status: "status",
  temporary_password: "temporary_password",
  "temporary password": "temporary_password",
  password: "temporary_password",
};

function parseOptionalNumber(value: string): number | null {
  return value.trim() ? Number(value) : null;
}

function parseBoolean(value: string | boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return ["1", "true", "yes", "y"].includes(value.trim().toLowerCase());
}

function friendlyError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please check the details and try again.";
  }

  try {
    const parsed = JSON.parse(error.message) as { detail?: string };
    if (typeof parsed.detail === "string") {
      return parsed.detail;
    }
  } catch {
    // Keep readable API messages as-is.
  }

  return error.message.length > 180
    ? "Something went wrong. Please check the required fields and try again."
    : error.message;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function normalizeStatus(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized === "inactive" || normalized === "disabled" ? "inactive" : "active";
}

function normalizeImportedRow(row: Record<string, unknown>, fallbackCollege: string): StudentForm {
  const normalized: StudentForm = { ...emptyStudentForm, college: fallbackCollege };

  Object.entries(row).forEach(([rawKey, rawValue]) => {
    const key = headerAliases[normalizeHeader(rawKey)] ?? headerAliases[rawKey.trim().toLowerCase()];
    if (!key) {
      return;
    }
    const value = rawValue === null || rawValue === undefined ? "" : String(rawValue).trim();
    if (key === "gap_during_grad") {
      normalized.gap_during_grad = parseBoolean(value);
    } else {
      normalized[key] = value as never;
    }
  });

  normalized.email = normalized.email.toLowerCase();
  normalized.status = normalizeStatus(normalized.status);
  normalized.backlogs = normalized.backlogs || "0";
  normalized.gap_years = normalized.gap_years || "0";
  normalized.college = normalized.college || fallbackCollege;
  return normalized;
}

function studentPayload(source: StudentForm, fallbackCollege: string) {
  return {
    email: source.email.trim().toLowerCase(),
    full_name: source.full_name.trim(),
    phone: source.phone.trim() || null,
    college: source.college.trim() || fallbackCollege || null,
    department: source.department.trim() || null,
    year_of_graduation: parseOptionalNumber(source.year_of_graduation),
    tenth_percentage: parseOptionalNumber(source.tenth_percentage),
    twelfth_percentage: parseOptionalNumber(source.twelfth_percentage),
    graduation_cgpa: parseOptionalNumber(source.graduation_cgpa),
    backlogs: Number(source.backlogs || 0),
    gap_years: Number(source.gap_years || 0),
    gap_during_grad: source.gap_during_grad,
    roll_number: source.roll_number.trim() || null,
    status: normalizeStatus(source.status),
    temporary_password: source.temporary_password.trim() || null,
  };
}

function validateStudents(rows: StudentForm[]) {
  if (!rows.length) {
    throw new Error("The spreadsheet has no student rows.");
  }

  rows.forEach((row, index) => {
    const missing = studentColumns
      .filter((column) => column.required)
      .filter((column) => !String(row[column.key]).trim())
      .map((column) => column.label);

    if (missing.length) {
      throw new Error(`Row ${index + 2} is missing: ${missing.join(", ")}.`);
    }
  });
}

async function readStudentSheet(file: File, fallbackCollege: string): Promise<StudentForm[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const workbook = XLSX.read(await file.text(), { type: "string" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils
      .sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
      .map((row) => normalizeImportedRow(row, fallbackCollege));
  }

  if (extension === "xlsx" || extension === "xls") {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils
      .sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
      .map((row) => normalizeImportedRow(row, fallbackCollege));
  }

  throw new Error("Upload a CSV, XLS, or XLSX file.");
}

function downloadSpreadsheetTemplate(collegeName: string) {
  const row = Object.fromEntries(
    studentColumns.map((column) => [
      column.label,
      column.key === "college" && collegeName ? collegeName : column.example,
    ]),
  );
  const worksheet = XLSX.utils.json_to_sheet([row]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
  XLSX.writeFile(workbook, "batch-students-template.xlsx");
}

function studentFormFromRecord(student: BatchStudent, fallbackCollege: string): StudentForm {
  return {
    email: student.profile.email || "",
    full_name: student.profile.full_name || "",
    phone: student.profile.phone || "",
    college: student.profile.college || fallbackCollege,
    department: student.profile.department || "",
    year_of_graduation: String(student.profile.year_of_graduation || ""),
    tenth_percentage: String(student.academics.tenth_percentage || ""),
    twelfth_percentage: String(student.academics.twelfth_percentage || ""),
    graduation_cgpa: String(student.academics.graduation_cgpa || ""),
    backlogs: String(student.academics.backlogs || 0),
    gap_years: String(student.academics.gap_years || 0),
    gap_during_grad: Boolean(student.academics.gap_during_grad),
    roll_number: student.roll_number || "",
    status: student.status || "active",
    temporary_password: "",
  };
}

export function BatchesPage() {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<College[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [college, setCollege] = useState<College | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [overviewBatchForm, setOverviewBatchForm] = useState({
    name: "",
    college_name: "",
    description: "",
  });
  const [batchForm, setBatchForm] = useState({ name: "", description: "" });
  const [studentForm, setStudentForm] = useState<StudentForm>({ ...emptyStudentForm });
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) ?? null;

  const filteredColleges = useMemo(
    () =>
      colleges.filter((item) =>
        item.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [colleges, search],
  );

  const workspaceStats = useMemo(
    () => [
      { label: "Batches", value: batches.length },
      { label: "Students", value: batches.reduce((sum, batch) => sum + (batch.student_count || 0), 0) },
      { label: "Active Roster", value: students.filter((student) => student.status === "active").length },
    ],
    [batches, students],
  );

  async function loadOverview() {
    setLoading(true);
    try {
      const [collegeResponse, batchResponse] = await Promise.all([
        api<{ items: College[] }>("/admin/colleges"),
        api<{ items: Batch[] }>("/admin/batches"),
      ]);
      setColleges(collegeResponse.items);
      setAllBatches(batchResponse.items);
      setMessage(null);
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents(batchId = selectedBatchId) {
    if (!batchId) {
      setStudents([]);
      return;
    }
    setStudentsLoading(true);
    try {
      const response = await api<{ items: BatchStudent[] }>(`/admin/batches/${batchId}/students`);
      setStudents(response.items);
    } catch (error) {
      setMessage(friendlyError(error));
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }

  async function loadCollegeWorkspace(id = collegeId, nextSelectedBatchId = selectedBatchId) {
    if (!id) {
      return;
    }
    setLoading(true);
    try {
      const [collegeResponse, batchesResponse] = await Promise.all([
        api<{ item: College }>(`/admin/colleges/${id}`),
        api<{ items: Batch[] }>(`/admin/colleges/${id}/batches`),
      ]);
      setCollege(collegeResponse.item);
      setBatches(batchesResponse.items);

      const stillExists = batchesResponse.items.some((batch) => batch.id === nextSelectedBatchId);
      const resolvedBatchId = stillExists ? nextSelectedBatchId : batchesResponse.items[0]?.id || "";
      setSelectedBatchId(resolvedBatchId);
      await loadStudents(resolvedBatchId);
      setMessage(null);
    } catch (error) {
      setMessage(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (collegeId) {
      loadCollegeWorkspace(collegeId);
    } else {
      loadOverview();
    }
  }, [collegeId]);

  async function createOverviewBatch(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      const response = await api<{ item: Batch }>("/admin/batches", {
        method: "POST",
        body: JSON.stringify({
          name: overviewBatchForm.name,
          college_name: overviewBatchForm.college_name,
          description: overviewBatchForm.description || null,
          active: true,
        }),
      });
      setOverviewBatchForm({ name: "", college_name: "", description: "" });
      await loadOverview();
      navigate(`/admin/batches/${response.item.college_id}`);
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  async function createCollegeBatch(event: FormEvent) {
    event.preventDefault();
    if (!collegeId) {
      return;
    }
    setMessage(null);
    try {
      const response = await api<{ item: Batch }>("/admin/batches", {
        method: "POST",
        body: JSON.stringify({
          name: batchForm.name,
          college_id: collegeId,
          description: batchForm.description || null,
          active: true,
        }),
      });
      setBatchForm({ name: "", description: "" });
      setSelectedBatchId(response.item.id);
      await loadCollegeWorkspace(collegeId, response.item.id);
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  async function selectBatch(batchId: string) {
    setSelectedBatchId(batchId);
    setStudentModalOpen(false);
    setEditingStudentId(null);
    setStudentForm({ ...emptyStudentForm, college: college?.name || "" });
    await loadStudents(batchId);
  }

  async function saveStudent(event: FormEvent) {
    event.preventDefault();
    if (!selectedBatchId) {
      setMessage("Select a batch first.");
      return;
    }

    setMessage(null);
    try {
      await api(
        editingStudentId
          ? `/admin/batches/${selectedBatchId}/students/${editingStudentId}`
          : `/admin/batches/${selectedBatchId}/students`,
        {
          method: editingStudentId ? "PUT" : "POST",
          body: JSON.stringify(studentPayload(studentForm, college?.name || "")),
        },
      );
      setStudentModalOpen(false);
      setEditingStudentId(null);
      setStudentForm({ ...emptyStudentForm, college: college?.name || "" });
      await loadStudents(selectedBatchId);
      await loadCollegeWorkspace(collegeId, selectedBatchId);
      setMessage(editingStudentId ? "Student updated." : "Student added to batch.");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  async function importStudents() {
    setMessage(null);
    if (!selectedBatchId) {
      setMessage("Select a batch first.");
      return;
    }
    if (!uploadFile) {
      setMessage("Choose an Excel or CSV file first.");
      return;
    }

    try {
      const importedStudents = await readStudentSheet(uploadFile, college?.name || "");
      validateStudents(importedStudents);
      const response = await api<{ created_count: number }>(
        `/admin/batches/${selectedBatchId}/students/bulk`,
        {
          method: "POST",
          body: JSON.stringify({
            students: importedStudents.map((student) =>
              studentPayload(student, college?.name || ""),
            ),
          }),
        },
      );
      setUploadFile(null);
      await loadStudents(selectedBatchId);
      await loadCollegeWorkspace(collegeId, selectedBatchId);
      setMessage(`Imported ${response.created_count} students into ${selectedBatch?.name || "the selected batch"}.`);
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function openStudentModal(student?: BatchStudent) {
    if (student) {
      setEditingStudentId(student.profile_id);
      setStudentForm(studentFormFromRecord(student, college?.name || ""));
    } else {
      setEditingStudentId(null);
      setStudentForm({ ...emptyStudentForm, college: college?.name || "" });
    }
    setStudentModalOpen(true);
  }

  async function removeStudent(profileId: string) {
    if (!selectedBatchId) {
      return;
    }
    await api(`/admin/batches/${selectedBatchId}/students/${profileId}`, { method: "DELETE" });
    await loadStudents(selectedBatchId);
    await loadCollegeWorkspace(collegeId, selectedBatchId);
  }

  if (!collegeId) {
    return (
      <section className="batch-admin-page">
        <header className="admin-hero-panel">
          <div>
            <p className="admin-kicker">Batch Operations</p>
            <h2>College and Batch Command Center</h2>
            <p>
              Create batches under a college, review cohort volume, and open a college
              workspace to manage student rosters individually or through spreadsheets.
            </p>
          </div>
          <div className="batch-hero-metrics">
            <article>
              <strong>{loading ? "-" : colleges.length}</strong>
              <span>Colleges</span>
            </article>
            <article>
              <strong>{loading ? "-" : allBatches.length}</strong>
              <span>Batches</span>
            </article>
          </div>
        </header>

        {message ? <p className={message.startsWith("Imported") ? "helper-text" : "error-text"}>{message}</p> : null}

        <div className="batch-command-grid">
          <form className="panel wide-panel" onSubmit={createOverviewBatch}>
            <div className="panel-header">
              <h3>Create Batch</h3>
              <Plus className="h-5 w-5 text-practice-amberDark" aria-hidden="true" />
            </div>
            <div className="inline-fields">
              <input
                required
                value={overviewBatchForm.name}
                onChange={(event) => setOverviewBatchForm({ ...overviewBatchForm, name: event.target.value })}
                placeholder="Batch name, e.g. 2027 CSE Placement Sprint"
              />
              <input
                required
                value={overviewBatchForm.college_name}
                onChange={(event) => setOverviewBatchForm({ ...overviewBatchForm, college_name: event.target.value })}
                placeholder="College name"
              />
              <button type="submit">Create and Open</button>
            </div>
            <textarea
              value={overviewBatchForm.description}
              onChange={(event) => setOverviewBatchForm({ ...overviewBatchForm, description: event.target.value })}
              rows={4}
              placeholder="Purpose, intake, hiring cycle, or internal notes"
            />
          </form>

          <section className="panel">
            <div className="panel-header">
              <h3>College Workspaces</h3>
              <label className="batch-search">
                <Search className="h-4 w-4" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search colleges"
                />
              </label>
            </div>

            <div className="batch-college-list">
              {filteredColleges.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="batch-college-card"
                  onClick={() => navigate(`/admin/batches/${item.id}`)}
                >
                  <span className="batch-card-icon">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.batch_count || 0} batches</small>
                    {item.info ? <small>{item.info}</small> : null}
                  </span>
                </button>
              ))}
              {!filteredColleges.length ? (
                <div className="admin-empty-state">No colleges match the current search.</div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="batch-admin-page">
      <header className="admin-hero-panel">
        <div>
          <button
            className="ghost-button page-action"
            type="button"
            onClick={() => navigate("/admin/batches")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All Colleges
          </button>
          <p className="admin-kicker">College Workspace</p>
          <h2>{college?.name || "College"}</h2>
          <p>{college?.info || "Create batches, manage rosters, and import student sheets for this college."}</p>
        </div>
        <div className="batch-hero-metrics">
          {workspaceStats.map((stat) => (
            <article key={stat.label}>
              <strong>{loading ? "-" : stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </header>

      {message ? <p className={message.includes("Imported") || message.includes("added") || message.includes("updated") ? "helper-text" : "error-text"}>{message}</p> : null}

      <div className="batch-workspace-grid">
        <aside className="panel batch-left-rail">
          <div className="panel-header">
            <h3>Batches</h3>
            <UsersRound className="h-5 w-5 text-practice-amberDark" aria-hidden="true" />
          </div>

          <form className="batch-create-card" onSubmit={createCollegeBatch}>
            <input
              required
              value={batchForm.name}
              onChange={(event) => setBatchForm({ ...batchForm, name: event.target.value })}
              placeholder="New batch name"
            />
            <textarea
              value={batchForm.description}
              onChange={(event) => setBatchForm({ ...batchForm, description: event.target.value })}
              rows={3}
              placeholder="Batch notes"
            />
            <button type="submit">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Batch
            </button>
          </form>

          <div className="batch-list">
            {batches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                className={selectedBatchId === batch.id ? "batch-list-card active" : "batch-list-card"}
                onClick={() => selectBatch(batch.id)}
              >
                <strong>{batch.name}</strong>
                <span>{batch.student_count || 0} students</span>
                {batch.description ? <small>{batch.description}</small> : null}
              </button>
            ))}
            {!batches.length ? (
              <div className="admin-empty-state">Create a batch to start adding students.</div>
            ) : null}
          </div>
        </aside>

        <main className="batch-roster-area">
          <section className="panel batch-toolbar">
            <div>
              <p className="admin-kicker">Selected Batch</p>
              <h3>{selectedBatch?.name || "No batch selected"}</h3>
              <p className="helper-text">
                {selectedBatch
                  ? selectedBatch.description || "Manage students, credentials, and academic metadata."
                  : "Select or create a batch before adding students."}
              </p>
            </div>
            <div className="admin-action-strip">
              <button
                type="button"
                disabled={!selectedBatchId}
                onClick={() => openStudentModal()}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Add Student
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => downloadSpreadsheetTemplate(college?.name || "")}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Template
              </button>
            </div>
          </section>

          <section className="panel batch-import-panel">
            <div>
              <div className="panel-header">
                <h3>Bulk Upload Students</h3>
                <FileSpreadsheet className="h-5 w-5 text-practice-amberDark" aria-hidden="true" />
              </div>
              <p className="helper-text">
                Upload `.xlsx`, `.xls`, or `.csv` with Email, Full Name, Roll Number,
                College, Department, Graduation Year, academic scores, status, and an
                optional temporary password.
              </p>
            </div>
            <div className="batch-upload-box">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              />
              <button type="button" onClick={importStudents} disabled={!selectedBatchId}>
                <Upload className="h-4 w-4" aria-hidden="true" />
                Import Sheet
              </button>
            </div>
            {uploadFile ? <p className="helper-text">Ready to import: {uploadFile.name}</p> : null}
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3>Student Roster</h3>
              <span className="tag">{students.length} records</span>
            </div>

            {studentsLoading ? (
              <div className="admin-empty-state">Loading students...</div>
            ) : students.length ? (
              <div className="batch-table-wrap">
                <table className="batch-student-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll / Dept</th>
                      <th>Year</th>
                      <th>Academics</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.profile_id}>
                        <td>
                          <strong>{student.profile.full_name || "Unnamed student"}</strong>
                          <span>{student.profile.email}</span>
                          {student.profile.phone ? <span>{student.profile.phone}</span> : null}
                        </td>
                        <td>
                          <strong>{student.roll_number || "No roll"}</strong>
                          <span>{student.profile.department || "Department unset"}</span>
                        </td>
                        <td>{student.profile.year_of_graduation || "NA"}</td>
                        <td>
                          <span>CGPA {student.academics.graduation_cgpa ?? "NA"}</span>
                          <span>Backlogs {student.academics.backlogs ?? 0}</span>
                        </td>
                        <td>
                          <span className={student.status === "active" ? "tag success" : "tag"}>
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-row">
                            <button className="ghost-button" type="button" onClick={() => openStudentModal(student)}>
                              Edit
                            </button>
                            <button className="danger-button" type="button" onClick={() => removeStudent(student.profile_id)}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty-state">
                {selectedBatchId
                  ? "No students in this batch yet. Add one student or import a spreadsheet."
                  : "Select a batch to view its roster."}
              </div>
            )}
          </section>
        </main>
      </div>

      {studentModalOpen ? (
        <div className="modal-backdrop">
          <form className="modal-panel wide-panel" onSubmit={saveStudent}>
            <div className="panel-header">
              <div>
                <h3>{editingStudentId ? "Update Student" : "Add Student"}</h3>
                <p className="helper-text">
                  Capture identity, college mapping, academic eligibility, and access setup.
                </p>
              </div>
              <button className="ghost-button" type="button" onClick={() => setStudentModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="settings-card">
              <h4>Identity</h4>
              <div className="inline-fields">
                <input required value={studentForm.email} onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} placeholder="Email" />
                <input required value={studentForm.full_name} onChange={(event) => setStudentForm({ ...studentForm, full_name: event.target.value })} placeholder="Full name" />
                <input value={studentForm.phone} onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })} placeholder="Phone" />
              </div>
            </div>

            <div className="settings-card">
              <h4>College Mapping</h4>
              <div className="inline-fields">
                <input value={studentForm.college} onChange={(event) => setStudentForm({ ...studentForm, college: event.target.value })} placeholder="College" />
                <input value={studentForm.department} onChange={(event) => setStudentForm({ ...studentForm, department: event.target.value })} placeholder="Department / Branch" />
                <input required value={studentForm.roll_number} onChange={(event) => setStudentForm({ ...studentForm, roll_number: event.target.value })} placeholder="Roll number" />
              </div>
              <div className="inline-fields">
                <input value={studentForm.year_of_graduation} onChange={(event) => setStudentForm({ ...studentForm, year_of_graduation: event.target.value })} placeholder="Graduation year" />
                <select value={studentForm.status} onChange={(event) => setStudentForm({ ...studentForm, status: event.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <input value={studentForm.temporary_password} onChange={(event) => setStudentForm({ ...studentForm, temporary_password: event.target.value })} placeholder="Temporary password" />
              </div>
            </div>

            <div className="settings-card">
              <h4>Eligibility and Academics</h4>
              <div className="inline-fields">
                <input value={studentForm.tenth_percentage} onChange={(event) => setStudentForm({ ...studentForm, tenth_percentage: event.target.value })} placeholder="10th percentage" />
                <input value={studentForm.twelfth_percentage} onChange={(event) => setStudentForm({ ...studentForm, twelfth_percentage: event.target.value })} placeholder="12th percentage" />
                <input value={studentForm.graduation_cgpa} onChange={(event) => setStudentForm({ ...studentForm, graduation_cgpa: event.target.value })} placeholder="Graduation CGPA" />
              </div>
              <div className="inline-fields">
                <input value={studentForm.backlogs} onChange={(event) => setStudentForm({ ...studentForm, backlogs: event.target.value })} placeholder="Backlogs" />
                <input value={studentForm.gap_years} onChange={(event) => setStudentForm({ ...studentForm, gap_years: event.target.value })} placeholder="Gap years" />
                <label className="checkbox">
                  <input type="checkbox" checked={studentForm.gap_during_grad} onChange={(event) => setStudentForm({ ...studentForm, gap_during_grad: event.target.checked })} />
                  Gap during graduation
                </label>
              </div>
            </div>

            <button type="submit">{editingStudentId ? "Update Student" : "Add Student"}</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

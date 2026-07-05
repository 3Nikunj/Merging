import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../services/api";
import type { Batch, BatchStudent, College } from "../../types/admin";

const studentCsvColumns = [
  "email",
  "full_name",
  "phone",
  "department",
  "year_of_graduation",
  "tenth_percentage",
  "twelfth_percentage",
  "graduation_cgpa",
  "backlogs",
  "gap_years",
  "gap_during_grad",
  "roll_number",
  "status",
  "temporary_password",
];

const requiredStudentCsvColumns = ["email", "full_name"];

const emptyStudentForm = {
  email: "",
  full_name: "",
  phone: "",
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

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];
    if (char === '"' && quoted && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows;
  const normalizedHeaders = headers.map((header) => header.trim().toLowerCase());
  return dataRows.map((dataRow) =>
    Object.fromEntries(normalizedHeaders.map((header, index) => [header, (dataRow[index] || "").trim()])),
  );
}

function csvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function parseOptionalNumber(value: string): number | null {
  return value.trim() ? Number(value) : null;
}

function parseBoolean(value: string): boolean {
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
    // Keep already-readable messages as-is.
  }
  return error.message.length > 180
    ? "Something went wrong. Please check the required fields and try again."
    : error.message;
}

function studentPayload(source: typeof emptyStudentForm | Record<string, string>) {
  return {
    email: source.email,
    full_name: source.full_name,
    phone: source.phone || null,
    college: null,
    department: source.department || null,
    year_of_graduation: parseOptionalNumber(String(source.year_of_graduation || "")),
    tenth_percentage: parseOptionalNumber(String(source.tenth_percentage || "")),
    twelfth_percentage: parseOptionalNumber(String(source.twelfth_percentage || "")),
    graduation_cgpa: parseOptionalNumber(String(source.graduation_cgpa || "")),
    backlogs: Number(source.backlogs || 0),
    gap_years: Number(source.gap_years || 0),
    gap_during_grad:
      typeof source.gap_during_grad === "boolean"
        ? source.gap_during_grad
        : parseBoolean(String(source.gap_during_grad || "")),
    roll_number: source.roll_number || null,
    status: source.status || "active",
    temporary_password: source.temporary_password || null,
  };
}

export function BatchesPage() {
  const { collegeId } = useParams();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<College[]>([]);
  const [college, setCollege] = useState<College | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [expandedBatchId, setExpandedBatchId] = useState("");
  const [search, setSearch] = useState("");
  const [overviewBatchForm, setOverviewBatchForm] = useState({ name: "", college_name: "", description: "" });
  const [batchForm, setBatchForm] = useState({ name: "", description: "" });
  const [studentForm, setStudentForm] = useState({ ...emptyStudentForm });
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filteredColleges = useMemo(
    () => colleges.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase())),
    [colleges, search],
  );

  async function loadColleges() {
    try {
      const response = await api<{ items: College[] }>("/admin/colleges");
      setColleges(response.items);
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  async function loadCollegeWorkspace(id = collegeId) {
    if (!id) {
      return;
    }
    try {
      const [collegeResponse, batchesResponse] = await Promise.all([
        api<{ item: College }>(`/admin/colleges/${id}`),
        api<{ items: Batch[] }>(`/admin/colleges/${id}/batches`),
      ]);
      setCollege(collegeResponse.item);
      setBatches(batchesResponse.items);
      const batchStillExists = batchesResponse.items.some((batch) => batch.id === expandedBatchId);
      if (!batchStillExists) {
        setExpandedBatchId("");
        setStudents([]);
      }
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  async function loadStudents(batchId = expandedBatchId) {
    if (!batchId) {
      setStudents([]);
      return;
    }
    try {
      const response = await api<{ items: BatchStudent[] }>(`/admin/batches/${batchId}/students`);
      setStudents(response.items);
    } catch (error) {
      setMessage(friendlyError(error));
      setStudents([]);
    }
  }

  useEffect(() => {
    if (collegeId) {
      loadCollegeWorkspace(collegeId);
    } else {
      loadColleges();
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
      await loadColleges();
      navigate(`/batches/${response.item.college_id}`);
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
      await api<{ item: Batch }>("/admin/batches", {
        method: "POST",
        body: JSON.stringify({
          name: batchForm.name,
          college_id: collegeId,
          description: batchForm.description || null,
          active: true,
        }),
      });
      setBatchForm({ name: "", description: "" });
      await loadCollegeWorkspace(collegeId);
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  async function expandBatch(batchId: string) {
    const nextBatchId = expandedBatchId === batchId ? "" : batchId;
    setExpandedBatchId(nextBatchId);
    setStudentModalOpen(false);
    setEditingStudentId(null);
    setStudentForm({ ...emptyStudentForm });
    await loadStudents(nextBatchId);
  }

  async function saveStudent(event: FormEvent) {
    event.preventDefault();
    if (!expandedBatchId) {
      setMessage("Select a batch first.");
      return;
    }
    setMessage(null);
    try {
      await api(
        editingStudentId
          ? `/admin/batches/${expandedBatchId}/students/${editingStudentId}`
          : `/admin/batches/${expandedBatchId}/students`,
        {
          method: editingStudentId ? "PUT" : "POST",
          body: JSON.stringify(studentPayload(studentForm)),
        },
      );
      setStudentModalOpen(false);
      setEditingStudentId(null);
      setStudentForm({ ...emptyStudentForm });
      await loadStudents(expandedBatchId);
      await loadCollegeWorkspace(collegeId);
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function validateCsv(rows: Record<string, string>[]) {
    if (!rows.length) {
      throw new Error("The CSV file has no student rows.");
    }
    const missingColumns = requiredStudentCsvColumns.filter((column) => !(column in rows[0]));
    if (missingColumns.length) {
      throw new Error(`Missing required column${missingColumns.length > 1 ? "s" : ""}: ${missingColumns.join(", ")}.`);
    }
    rows.forEach((row, index) => {
      const emptyColumns = requiredStudentCsvColumns.filter((column) => !row[column]?.trim());
      if (emptyColumns.length) {
        throw new Error(`Row ${index + 2} is missing: ${emptyColumns.join(", ")}.`);
      }
    });
  }

  async function importCsv() {
    setMessage(null);
    if (!expandedBatchId) {
      setMessage("Select a batch first.");
      return;
    }
    if (!csvFile) {
      setMessage("Choose a CSV file first.");
      return;
    }
    try {
      const rows = parseCsv(await csvFile.text());
      validateCsv(rows);
      const response = await api<{ created_count: number }>(`/admin/batches/${expandedBatchId}/students/bulk`, {
        method: "POST",
        body: JSON.stringify({ students: rows.map(studentPayload) }),
      });
      setMessage(`Imported ${response.created_count} students.`);
      setCsvFile(null);
      await loadStudents(expandedBatchId);
      await loadCollegeWorkspace(collegeId);
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function downloadTemplate() {
    const example = [
      "student@example.com",
      "Sample Student",
      "9876543210",
      "Computer Science",
      "2027",
      "88",
      "86",
      "8.4",
      "0",
      "0",
      "false",
      "CS-001",
      "active",
      "TempPass123",
    ];
    const csv = `${studentCsvColumns.join(",")}\n${example.map(csvValue).join(",")}\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "batch-students-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function openStudentModal(student?: BatchStudent) {
    if (student) {
      setEditingStudentId(student.profile_id);
      setStudentForm({
        email: student.profile.email || "",
        full_name: student.profile.full_name || "",
        phone: student.profile.phone || "",
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
      });
    } else {
      setEditingStudentId(null);
      setStudentForm({ ...emptyStudentForm });
    }
    setStudentModalOpen(true);
  }

  if (!collegeId) {
    return (
      <section>
        <header className="page-header">
          <h2>Batches</h2>
          <p>Create batches under colleges and browse colleges by their batch count.</p>
        </header>

        <div className="split-grid">
          <form className="panel wide-panel" onSubmit={createOverviewBatch}>
            <h3>Create Batch</h3>
            <input value={overviewBatchForm.name} onChange={(event) => setOverviewBatchForm({ ...overviewBatchForm, name: event.target.value })} placeholder="Batch name" />
            <input value={overviewBatchForm.college_name} onChange={(event) => setOverviewBatchForm({ ...overviewBatchForm, college_name: event.target.value })} placeholder="College name" />
            <textarea value={overviewBatchForm.description} onChange={(event) => setOverviewBatchForm({ ...overviewBatchForm, description: event.target.value })} rows={4} placeholder="Description" />
            {message ? <p className="error-text">{message}</p> : null}
            <button type="submit">Create Batch</button>
          </form>

          <section className="panel">
            <div className="panel-header">
              <h3>Colleges</h3>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search colleges" />
            </div>
            <ul className="item-list">
              {filteredColleges.map((item) => (
                <li key={item.id} className="clickable-item" onClick={() => navigate(`/batches/${item.id}`)}>
                  <div className="list-row">
                    <div className="item-meta">
                      <strong>{item.name}</strong>
                      <span>{item.batch_count || 0} batches</span>
                      {item.info ? <span>{item.info}</span> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section>
      <header className="page-header">
        <button className="ghost-button page-action" type="button" onClick={() => navigate("/batches")}>
          Back
        </button>
        <h2>{college?.name || "College"}</h2>
        <p>{college?.info || "Manage batches and students for this college."}</p>
      </header>

      <form className="panel wide-panel compact-form" onSubmit={createCollegeBatch}>
        <h3>Create Batch</h3>
        <div className="inline-fields">
          <input value={batchForm.name} onChange={(event) => setBatchForm({ ...batchForm, name: event.target.value })} placeholder="Batch name" />
          <input value={batchForm.description} onChange={(event) => setBatchForm({ ...batchForm, description: event.target.value })} placeholder="Description" />
          <button type="submit">Create Batch</button>
        </div>
        {message ? <p className={message.includes("Imported") ? "helper-text" : "error-text"}>{message}</p> : null}
      </form>

      <div className="tile-grid">
        {batches.map((batch) => (
          <section key={batch.id} className="panel batch-tile">
            <button className="tile-button" type="button" onClick={() => expandBatch(batch.id)}>
              <span>
                <strong>{batch.name}</strong>
                <small>{batch.student_count || 0} students</small>
              </span>
              <span>{expandedBatchId === batch.id ? "Collapse" : "Open"}</span>
            </button>

            {expandedBatchId === batch.id ? (
              <div className="expanded-panel">
                {batch.description ? <p className="helper-text">{batch.description}</p> : null}
                <div className="two-column-tools">
                  <button type="button" onClick={() => openStudentModal()}>
                    Add a Student
                  </button>
                  <div className="import-tool">
                    <div className="action-row">
                      <button className="ghost-button" type="button" onClick={downloadTemplate}>
                        Template
                      </button>
                      <button type="button" onClick={importCsv}>
                        Import CSV
                      </button>
                    </div>
                    <input type="file" accept=".csv,text/csv" onChange={(event) => setCsvFile(event.target.files?.[0] || null)} />
                  </div>
                </div>

                <ul className="item-list">
                  {students.map((student) => (
                    <li key={student.profile_id}>
                      <div className="list-row">
                        <div className="item-meta">
                          <strong>{student.profile.full_name || "Unnamed student"}</strong>
                          <span>{student.profile.email} | {student.status}</span>
                          <span>{[student.roll_number, student.profile.department].filter(Boolean).join(" | ") || "No academic mapping"}</span>
                        </div>
                        <div className="action-row">
                          <button className="ghost-button" type="button" onClick={() => openStudentModal(student)}>
                            Update
                          </button>
                          <button className="danger-button" type="button" onClick={async () => {
                            await api(`/admin/batches/${expandedBatchId}/students/${student.profile_id}`, { method: "DELETE" });
                            await loadStudents(expandedBatchId);
                            await loadCollegeWorkspace(collegeId);
                          }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {studentModalOpen ? (
        <div className="modal-backdrop">
          <form className="modal-panel wide-panel" onSubmit={saveStudent}>
            <div className="panel-header">
              <h3>{editingStudentId ? "Update Student" : "Add a Student"}</h3>
              <button className="ghost-button" type="button" onClick={() => setStudentModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="inline-fields">
              <input value={studentForm.email} onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} placeholder="Email" />
              <input value={studentForm.full_name} onChange={(event) => setStudentForm({ ...studentForm, full_name: event.target.value })} placeholder="Full name" />
              <input value={studentForm.phone} onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })} placeholder="Phone" />
            </div>
            <div className="inline-fields">
              <input value={studentForm.department} onChange={(event) => setStudentForm({ ...studentForm, department: event.target.value })} placeholder="Department" />
              <input value={studentForm.year_of_graduation} onChange={(event) => setStudentForm({ ...studentForm, year_of_graduation: event.target.value })} placeholder="Graduation year" />
              <input value={studentForm.roll_number} onChange={(event) => setStudentForm({ ...studentForm, roll_number: event.target.value })} placeholder="Roll number" />
            </div>
            <div className="inline-fields">
              <input value={studentForm.tenth_percentage} onChange={(event) => setStudentForm({ ...studentForm, tenth_percentage: event.target.value })} placeholder="10th %" />
              <input value={studentForm.twelfth_percentage} onChange={(event) => setStudentForm({ ...studentForm, twelfth_percentage: event.target.value })} placeholder="12th %" />
              <input value={studentForm.graduation_cgpa} onChange={(event) => setStudentForm({ ...studentForm, graduation_cgpa: event.target.value })} placeholder="Graduation CGPA" />
            </div>
            <div className="inline-fields">
              <input value={studentForm.backlogs} onChange={(event) => setStudentForm({ ...studentForm, backlogs: event.target.value })} placeholder="Backlogs" />
              <input value={studentForm.gap_years} onChange={(event) => setStudentForm({ ...studentForm, gap_years: event.target.value })} placeholder="Gap years" />
              <select value={studentForm.status} onChange={(event) => setStudentForm({ ...studentForm, status: event.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="inline-fields">
              <input value={studentForm.temporary_password} onChange={(event) => setStudentForm({ ...studentForm, temporary_password: event.target.value })} placeholder="Temporary password" />
              <label className="checkbox">
                <input type="checkbox" checked={studentForm.gap_during_grad} onChange={(event) => setStudentForm({ ...studentForm, gap_during_grad: event.target.checked })} />
                Gap during graduation
              </label>
            </div>
            <button type="submit">{editingStudentId ? "Update Student" : "Add Student"}</button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

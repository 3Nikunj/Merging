import { useState, useEffect } from "react";
import AppLayout from "../../../components/student/layout/AppLayout";
import { api, UserProfileResponse } from "../../../services/api";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Globe,
  Link,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Camera,
} from "lucide-react";

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form fields state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfGraduation, setYearOfGraduation] = useState<number | "">("");
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [skills, setSkills] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [membershipType, setMembershipType] = useState("Regular");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("error", "Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setAvatarUrl(dataUrl);
          showNotification("success", "Profile picture selected!");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [tenthPercentage, setTenthPercentage] = useState<number | "">("");
  const [twelfthPercentage, setTwelfthPercentage] = useState<number | "">("");
  const [graduationCgpa, setGraduationCgpa] = useState<number | "">("");
  const [backlogs, setBacklogs] = useState<number>(0);
  const [gapYears, setGapYears] = useState<number>(0);
  const [gapDuringGrad, setGapDuringGrad] = useState(false);

  // Active tab state: 'personal' | 'academic' | 'gaps'
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "gaps">("personal");

  // Notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfileData(data);
      
      // Populate fields
      setFullName(data.profile.full_name || "");
      setPhone(data.profile.phone || "");
      setCollege(data.profile.college || "");
      setDepartment(data.profile.department || "");
      setYearOfGraduation(data.profile.year_of_graduation || "");
      setBio(data.profile.bio || "");
      setGithubUrl(data.profile.github_url || "");
      setLinkedinUrl(data.profile.linkedin_url || "");
      setSkills(data.profile.skills || "");
      setAvatarUrl(data.profile.avatar_url || null);
      setMembershipType(data.profile.membership_type || "Regular");

      if (data.academics) {
        setTenthPercentage(data.academics.tenth_percentage || "");
        setTwelfthPercentage(data.academics.twelfth_percentage || "");
        setGraduationCgpa(data.academics.graduation_cgpa || "");
        setBacklogs(data.academics.backlogs || 0);
        setGapYears(data.academics.gap_years || 0);
        setGapDuringGrad(data.academics.gap_during_grad || false);
      }
    } catch (err: any) {
      showNotification("error", "Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        college: college.trim() || null,
        department: department.trim() || null,
        year_of_graduation: yearOfGraduation === "" ? null : Number(yearOfGraduation),
        tenth_percentage: tenthPercentage === "" ? null : Number(tenthPercentage),
        twelfth_percentage: twelfthPercentage === "" ? null : Number(twelfthPercentage),
        graduation_cgpa: graduationCgpa === "" ? null : Number(graduationCgpa),
        backlogs: Number(backlogs) || 0,
        gap_years: Number(gapYears) || 0,
        gap_during_grad: gapDuringGrad,
        bio: bio.trim() || null,
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        skills: skills.trim() || null,
        avatar_url: avatarUrl,
        membership_type: membershipType,
      };

      const updated = await api.updateProfile(payload);
      setProfileData(updated);
      setIsEditing(false);
      showNotification("success", "Profile updated successfully!");
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err: any) {
      showNotification("error", "Failed to update profile. " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFullName(profileData.profile.full_name || "");
      setPhone(profileData.profile.phone || "");
      setCollege(profileData.profile.college || "");
      setDepartment(profileData.profile.department || "");
      setYearOfGraduation(profileData.profile.year_of_graduation || "");
      setBio(profileData.profile.bio || "");
      setGithubUrl(profileData.profile.github_url || "");
      setLinkedinUrl(profileData.profile.linkedin_url || "");
      setSkills(profileData.profile.skills || "");
      setAvatarUrl(profileData.profile.avatar_url || null);
      setMembershipType(profileData.profile.membership_type || "Regular");

      if (profileData.academics) {
        setTenthPercentage(profileData.academics.tenth_percentage || "");
        setTwelfthPercentage(profileData.academics.twelfth_percentage || "");
        setGraduationCgpa(profileData.academics.graduation_cgpa || "");
        setBacklogs(profileData.academics.backlogs || 0);
        setGapYears(profileData.academics.gap_years || 0);
        setGapDuringGrad(profileData.academics.gap_during_grad || false);
      }
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <AppLayout>
      <div className="relative mx-auto max-w-4xl space-y-6">
        
        {/* Visual Notification System */}
        {notification && (
          <div
            className={`fixed right-6 top-24 z-50 flex items-center gap-3 rounded-xl px-5 py-4 shadow-dashboard transition-all duration-300 animate-slide-in ${
              notification.type === "success"
                ? "border border-green-500 bg-white text-green-700"
                : "border border-practice-error bg-white text-practice-error"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-practice-error" />
            )}
            <p className="text-sm font-semibold">{notification.message}</p>
          </div>
        )}

        {loading ? (
          /* Sleek Skeleton Loading state */
          <div className="animate-pulse space-y-6">
            <div className="h-48 rounded-2xl bg-white shadow-dashboard"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="h-32 rounded-xl bg-white shadow-dashboard md:col-span-1"></div>
              <div className="h-96 rounded-xl bg-white shadow-dashboard md:col-span-3"></div>
            </div>
          </div>
        ) : (
          profileData && (
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Profile Card Header with Gradient Accent */}
              <div className="overflow-hidden rounded-2xl border border-practice-line bg-white shadow-dashboard transition-all duration-300">
                <div className="h-32 bg-gradient-to-r from-practice-sidebar via-practice-sidebarActive to-practice-amber"></div>
                <div className="relative px-6 pb-6 pt-16 sm:px-8">
                  {/* Avatar Container */}
                  <div className="absolute -top-16 left-6 sm:left-8 group relative flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-practice-amber text-3xl font-extrabold text-practice-sidebar shadow-dashboard overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      getInitials(fullName || profileData.profile.email)
                    )}
                    
                    {isEditing && (
                      <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 animate-fade-in">
                        <Camera className="h-6 w-6" />
                        <span className="text-[10px] font-bold mt-1">Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-extrabold tracking-tight text-practice-ink">
                          {fullName || "User Profile"}
                        </h1>
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-extrabold text-practice-amberDark border border-practice-amber/50 animate-fade-in">
                          {membershipType}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-practice-subdued">
                        {profileData.profile.email}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 rounded-xl bg-practice-ink px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-practice-sidebar hover:shadow-lg focus:outline-none"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Profile
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCancel}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl border border-practice-line bg-white px-4 py-2.5 text-sm font-bold text-practice-subdued transition-all hover:bg-practice-muted focus:outline-none disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-practice-amber px-4 py-2.5 text-sm font-bold text-practice-sidebar transition-all hover:bg-yellow-400 hover:shadow-lg focus:outline-none disabled:opacity-50"
                          >
                            {saving ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-practice-sidebar border-t-transparent" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save Changes
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Tab Navigation for details */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                
                {/* Side Navigation Tabs Card */}
                <div className="h-fit rounded-2xl border border-practice-line bg-white p-4 shadow-dashboard">
                  <nav className="flex flex-row gap-1 md:flex-col">
                    <button
                      type="button"
                      onClick={() => setActiveTab("personal")}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        activeTab === "personal"
                          ? "bg-practice-muted text-practice-sidebar"
                          : "text-practice-subdued hover:bg-practice-muted/50"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      Personal & Social
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("academic")}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        activeTab === "academic"
                          ? "bg-practice-muted text-practice-sidebar"
                          : "text-practice-subdued hover:bg-practice-muted/50"
                      }`}
                    >
                      <GraduationCap className="h-4 w-4" />
                      Academic History
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("gaps")}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        activeTab === "gaps"
                          ? "bg-practice-muted text-practice-sidebar"
                          : "text-practice-subdued hover:bg-practice-muted/50"
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                      Status & Gaps
                    </button>
                  </nav>
                </div>

                {/* Form Main Area Card */}
                <div className="rounded-2xl border border-practice-line bg-white p-6 shadow-dashboard md:col-span-3 sm:p-8">
                  
                  {/* TAB 1: Personal & Social Details */}
                  {activeTab === "personal" && (
                    <div className="space-y-6">
                      <div className="border-b border-practice-muted pb-4">
                        <h2 className="text-lg font-bold text-practice-ink">Personal & Professional Info</h2>
                        <p className="text-xs text-practice-subdued">
                          Manage your basic identity, socials, bio, and key skills.
                        </p>
                      </div>

                      {/* Bio Field */}
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                          About / Bio
                        </label>
                        {isEditing ? (
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            placeholder="Write a brief professional summary about yourself..."
                            className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                          />
                        ) : (
                          <p className="text-sm italic text-practice-text bg-practice-surface rounded-xl p-4 border border-practice-line/30">
                            {bio || "No summary provided."}
                          </p>
                        )}
                      </div>

                      {/* Standard Grid Fields */}
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Full Name
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                              required
                            />
                          ) : (
                            <p className="text-sm font-semibold text-practice-text">{fullName || "Not Specified"}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Email Address <span className="text-[10px] text-practice-subdued">(Read-Only)</span>
                          </label>
                          <div className="flex items-center gap-2 rounded-xl bg-practice-muted/50 border border-practice-line/30 px-4 py-3 text-sm text-practice-subdued">
                            <Mail className="h-4 w-4" />
                            {profileData.profile.email}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Phone Number
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+91 XXXXX XXXXX"
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-practice-subdued" />
                              <p className="text-sm font-semibold text-practice-text">{phone || "Not Specified"}</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Year of Graduation
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={yearOfGraduation}
                              onChange={(e) => setYearOfGraduation(e.target.value === "" ? "" : Number(e.target.value))}
                              placeholder="2026"
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-practice-text">{yearOfGraduation || "Not Specified"}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Membership Type
                          </label>
                          {isEditing ? (
                            <select
                              value={membershipType}
                              onChange={(e) => setMembershipType(e.target.value)}
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm bg-white transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            >
                              <option value="Regular">Regular</option>
                              <option value="Silver Member">Silver Member</option>
                              <option value="Gold Member">Gold Member</option>
                              <option value="Platinum Member">Platinum Member</option>
                            </select>
                          ) : (
                            <div className="flex items-center">
                              <span className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-bold text-practice-amberDark border border-practice-amber/50">
                                {membershipType}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Professional Skills Field */}
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                          Primary Skills
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="e.g. React, TypeScript, Python, AWS"
                            className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {skills ? (
                              skills.split(",").map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-practice-muted/80 border border-practice-line/50 px-3 py-1.5 text-xs font-bold text-practice-sidebar"
                                >
                                  <Sparkles className="h-3 w-3 text-practice-amberDark" />
                                  {skill.trim()}
                                </span>
                              ))
                            ) : (
                              <p className="text-sm text-practice-subdued">No skills listed yet.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Social Links */}
                      <div className="space-y-4 pt-4 border-t border-practice-muted">
                        <h3 className="text-sm font-bold text-practice-ink">Professional Links</h3>
                        
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-practice-subdued">
                              <Globe className="h-4 w-4" />
                              GitHub Profile URL
                            </label>
                            {isEditing ? (
                              <input
                                type="url"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                placeholder="https://github.com/your-username"
                                className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                              />
                            ) : (
                              githubUrl ? (
                                <a
                                  href={githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                                >
                                  {githubUrl}
                                </a>
                              ) : (
                                <p className="text-sm text-practice-subdued">Not Linked</p>
                              )
                            )}
                          </div>

                          <div>
                            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-practice-subdued">
                              <Link className="h-4 w-4" />
                              LinkedIn Profile URL
                            </label>
                            {isEditing ? (
                              <input
                                type="url"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                placeholder="https://linkedin.com/in/your-username"
                                className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                              />
                            ) : (
                              linkedinUrl ? (
                                <a
                                  href={linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                                >
                                  {linkedinUrl}
                                </a>
                              ) : (
                                <p className="text-sm text-practice-subdued">Not Linked</p>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Academic Details */}
                  {activeTab === "academic" && (
                    <div className="space-y-6">
                      <div className="border-b border-practice-muted pb-4">
                        <h2 className="text-lg font-bold text-practice-ink">Academic Scores</h2>
                        <p className="text-xs text-practice-subdued">
                          Keep your educational status, college info, and overall performance up to date.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            College Name
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={college}
                              onChange={(e) => setCollege(e.target.value)}
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-practice-text">{college || "Not Specified"}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Department / Major
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-practice-text">{department || "Not Specified"}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            10th Standard Percentage (%)
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={tenthPercentage}
                              onChange={(e) => setTenthPercentage(e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-practice-text">
                              {tenthPercentage ? `${tenthPercentage}%` : "Not Specified"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            12th Standard Percentage (%)
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={twelfthPercentage}
                              onChange={(e) => setTwelfthPercentage(e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-practice-text">
                              {twelfthPercentage ? `${twelfthPercentage}%` : "Not Specified"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Graduation CGPA
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={graduationCgpa}
                              onChange={(e) => setGraduationCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-practice-text">
                              {graduationCgpa ? `${graduationCgpa} / 10.0` : "Not Specified"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Flags & Gaps */}
                  {activeTab === "gaps" && (
                    <div className="space-y-6">
                      <div className="border-b border-practice-muted pb-4">
                        <h2 className="text-lg font-bold text-practice-ink">Academic Status & Gaps</h2>
                        <p className="text-xs text-practice-subdued">
                          Ensure transparency regarding backlogs and academic career gaps.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Active Backlogs
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={backlogs}
                              onChange={(e) => setBacklogs(Number(e.target.value))}
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            />
                          ) : (
                            <span
                              className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-bold ${
                                backlogs > 0
                                  ? "bg-red-50 text-practice-error border border-red-200"
                                  : "bg-green-50 text-green-700 border border-green-200"
                              }`}
                            >
                              {backlogs} {backlogs === 1 ? "Backlog" : "Backlogs"}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Cumulative Gap Years
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={gapYears}
                              onChange={(e) => setGapYears(Number(e.target.value))}
                              className="w-full rounded-xl border border-practice-line px-4 py-3 text-sm transition-all focus:border-practice-amber focus:ring-1 focus:ring-practice-amber outline-none"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-practice-text">
                              {gapYears} {gapYears === 1 ? "Year" : "Years"}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-practice-subdued">
                            Gap During Graduation?
                          </label>
                          {isEditing ? (
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id="gapDuringGrad"
                                checked={gapDuringGrad}
                                onChange={(e) => setGapDuringGrad(e.target.checked)}
                                className="h-5 w-5 rounded-md border-practice-line text-practice-amber focus:ring-practice-amber"
                              />
                              <label htmlFor="gapDuringGrad" className="text-sm font-semibold text-practice-text">
                                Yes, I had an academic gap during my graduation years.
                              </label>
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-practice-text">
                              {gapDuringGrad ? "Yes, gap during graduation" : "No, continuous graduation"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </form>
          )
        )}
      </div>
    </AppLayout>
  );
}

export default ProfilePage;

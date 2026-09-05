import React, { useEffect, useRef, useState } from "react";
import {
    deleteMyAvatar,
    getMyProfile,
    updateMyProfile,
    uploadMyAvatar,
} from "../api/employeeApi";
import type { EmployeeProfile } from "../types/employee.types";
import toast from "react-hot-toast";
import {
    User,
    CreditCard,
    Edit3,
    MapPin,
    Phone,
    Building2,
    BriefcaseBusiness,
    UserRound,
    Camera,
    Eye,
    Upload,
    Trash2,
    X,
    Check,
    Mail,
    ShieldCheck,
    Landmark,
    Save,
    ChevronRight,
} from "lucide-react";

export default function MyProfile() {
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        bankName: "",
        bankAccountNo: "",
        bankIFSC: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await getMyProfile();
            const data = res.data?.data || res.data;

            if (data) {
                setProfile(data);

                setFormData({
                    phone: data.phone || "",
                    address: data.address || "",
                    city: data.city || "",
                    state: data.state || "",
                    country: data.country || "",
                    postalCode: data.postalCode || "",
                    bankName: data.bankName || "",
                    bankAccountNo: data.bankAccountNo || "",
                    bankIFSC: data.bankIFSC || "",
                });
            }
        } catch {
            toast.error("Failed to load profile details");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (file?: File) => {
        if (!file) return;

        if (
            !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
                file.type,
            )
        ) {
            toast.error("Choose a JPEG, PNG, WebP, or GIF image.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Profile images must be 5 MB or smaller.");
            return;
        }

        setAvatarUploading(true);

        try {
            const response = await uploadMyAvatar(file);

            setProfile(response.data.data);
            toast.success("Profile photo updated.");
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                    "Failed to upload profile photo.",
            );
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleAvatarDelete = async () => {
        setAvatarUploading(true);

        try {
            const response = await deleteMyAvatar();

            setProfile(response.data.data);
            setShowAvatarModal(false);

            toast.success("Profile photo removed.");
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                    "Failed to remove profile photo.",
            );
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateMyProfile(formData);

            toast.success("Profile updated successfully!");
            setIsEditing(false);

            await fetchProfile();
        } catch {
            toast.error("Failed to update profile");
        }
    };

    const updateField = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const getFullName = () => {
        if (!profile) return "Employee";

        const firstName = profile.firstName || "";
        const lastName = profile.lastName || "";

        return `${firstName} ${lastName}`.trim() || "Employee";
    };

    const getInitials = () => {
        const name = getFullName();

        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    };

    const jobTitle = profile?.jobPosition || profile?.jobTitle || "Employee";

    const department = profile?.department?.name || "Department not assigned";

    const managerName = profile?.manager
        ? `${profile.manager.firstName || ""} ${
              profile.manager.lastName || ""
          }`.trim()
        : "Not assigned";

    const hasAvatar = Boolean(profile?.avatarUrl);

    if (loading) {
        return (
            <div className="min-h-[500px] flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                    <p className="text-sm text-slate-500">
                        Loading your profile...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* =====================================================
                        PAGE HEADER
                    ====================================================== */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                                <span>Account</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                                <span className="text-slate-700">
                                    My Profile
                                </span>
                            </div>

                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                                My Profile
                            </h1>

                            <p className="mt-1 max-w-2xl text-sm text-slate-500">
                                View and manage your personal information,
                                contact details, and payment information.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsEditing((prev) => !prev)}
                            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all ${
                                isEditing
                                    ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    : "bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
                            }`}
                        >
                            {isEditing ? (
                                <>
                                    <X className="h-4 w-4" />
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Edit3 className="h-4 w-4" />
                                    Edit profile
                                </>
                            )}
                        </button>
                    </div>

                    {/* =====================================================
                        PROFILE HERO
                    ====================================================== */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="h-24 bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50 sm:h-28" />

                        <div className="px-5 pb-5 sm:px-7 sm:pb-7">
                            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                    {/* Avatar */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            hasAvatar
                                                ? setShowAvatarModal(true)
                                                : avatarInputRef.current?.click()
                                        }
                                        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-indigo-100 shadow-md sm:h-28 sm:w-28"
                                        aria-label={
                                            hasAvatar
                                                ? "View profile photo"
                                                : "Upload profile photo"
                                        }
                                    >
                                        {hasAvatar ? (
                                            <img
                                                src={profile?.avatarUrl}
                                                alt={`${getFullName()} profile`}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-2xl font-semibold text-indigo-600">
                                                {getInitials()}
                                            </div>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/65 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                            {hasAvatar ? (
                                                <>
                                                    <Eye className="h-5 w-5 text-white" />
                                                    <span className="mt-1 text-[11px] font-medium text-white">
                                                        View photo
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="h-5 w-5 text-white" />
                                                    <span className="mt-1 text-[11px] font-medium text-white">
                                                        Add photo
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {hasAvatar && (
                                            <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-slate-600 shadow-sm">
                                                <Camera className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                    </button>

                                    {/* Employee identity */}
                                    <div className="pb-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                                                {getFullName()}
                                            </h2>

                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                {profile?.status || "ACTIVE"}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-sm font-medium text-slate-600">
                                            {jobTitle}
                                        </p>

                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {department}
                                            </span>

                                            <span className="inline-flex items-center gap-1.5">
                                                <BriefcaseBusiness className="h-3.5 w-3.5" />
                                                {profile?.department?.code ||
                                                    "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Photo actions */}
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                        onChange={(e) => {
                                            handleAvatarUpload(
                                                e.target.files?.[0],
                                            );
                                            e.target.value = "";
                                        }}
                                    />

                                    <button
                                        type="button"
                                        disabled={avatarUploading}
                                        onClick={() =>
                                            avatarInputRef.current?.click()
                                        }
                                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                        {avatarUploading
                                            ? "Uploading..."
                                            : hasAvatar
                                              ? "Replace photo"
                                              : "Upload photo"}
                                    </button>

                                    {hasAvatar && (
                                        <button
                                            type="button"
                                            disabled={avatarUploading}
                                            onClick={() =>
                                                setShowAvatarModal(true)
                                            }
                                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        CONTENT
                    ====================================================== */}
                    {isEditing ? (
                        <EditProfileForm
                            formData={formData}
                            updateField={updateField}
                            handleUpdate={handleUpdate}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            {/* =================================================
                                LEFT / MAIN INFORMATION
                            ================================================== */}
                            <div className="space-y-6 xl:col-span-2">
                                {/* Employment */}
                                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <SectionHeader
                                        icon={
                                            <BriefcaseBusiness className="h-4 w-4" />
                                        }
                                        title="Employment"
                                        description="Your current role and reporting information"
                                        iconClass="bg-indigo-50 text-indigo-600"
                                    />

                                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
                                        <InfoItem
                                            icon={<BriefcaseBusiness />}
                                            label="Job position"
                                            value={jobTitle}
                                        />

                                        <InfoItem
                                            icon={<Building2 />}
                                            label="Department"
                                            value={
                                                profile?.department?.name || "—"
                                            }
                                        />

                                        <InfoItem
                                            icon={<UserRound />}
                                            label="Reporting manager"
                                            value={managerName}
                                        />

                                        <InfoItem
                                            icon={<ShieldCheck />}
                                            label="Employee status"
                                            value={profile?.status || "ACTIVE"}
                                            valueClass="text-emerald-600"
                                        />
                                    </div>
                                </section>

                                {/* Contact */}
                                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <SectionHeader
                                        icon={<Phone className="h-4 w-4" />}
                                        title="Contact & Address"
                                        description="How your organization can reach you"
                                        iconClass="bg-blue-50 text-blue-600"
                                    />

                                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
                                        <InfoItem
                                            icon={<Phone />}
                                            label="Phone number"
                                            value={
                                                profile?.phone || "Not provided"
                                            }
                                        />

                                        <InfoItem
                                            icon={<Mail />}
                                            label="Email"
                                            value={
                                                (profile as any)?.email ||
                                                (profile as any)?.workEmail ||
                                                "Not available"
                                            }
                                        />

                                        <div className="sm:col-span-2">
                                            <InfoItem
                                                icon={<MapPin />}
                                                label="Address"
                                                value={
                                                    [
                                                        profile?.address,
                                                        profile?.city,
                                                        profile?.state,
                                                        profile?.country,
                                                        profile?.postalCode,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ") ||
                                                    "Not provided"
                                                }
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* =================================================
                                RIGHT SIDEBAR
                            ================================================== */}
                            <div className="space-y-6">
                                {/* Quick profile card */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <User className="h-4 w-4" />
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                Profile overview
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Your account at a glance
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        <MiniInfo
                                            label="Position"
                                            value={jobTitle}
                                        />

                                        <MiniInfo
                                            label="Department"
                                            value={department}
                                        />

                                        <MiniInfo
                                            label="Manager"
                                            value={managerName}
                                        />
                                    </div>
                                </section>

                                {/* Banking */}
                                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <SectionHeader
                                        icon={<Landmark className="h-4 w-4" />}
                                        title="Banking"
                                        description="Direct deposit information"
                                        iconClass="bg-emerald-50 text-emerald-600"
                                    />

                                    <div className="space-y-5 p-5 sm:p-6">
                                        <InfoItem
                                            icon={<Landmark />}
                                            label="Bank name"
                                            value={
                                                profile?.bankName ||
                                                "Not provided"
                                            }
                                        />

                                        <InfoItem
                                            icon={<CreditCard />}
                                            label="Account number"
                                            value={
                                                profile?.bankAccountNo
                                                    ? `•••• •••• ${profile.bankAccountNo.slice(
                                                          -4,
                                                      )}`
                                                    : "Not provided"
                                            }
                                        />

                                        <InfoItem
                                            icon={<ShieldCheck />}
                                            label="IFSC code"
                                            value={
                                                profile?.bankIFSC ||
                                                "Not provided"
                                            }
                                        />

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <div className="flex gap-2">
                                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                                                <p className="text-[11px] leading-5 text-slate-500">
                                                    Your account number is
                                                    partially hidden for
                                                    security. Only the last four
                                                    digits are displayed.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {/* =====================================================
                        PHOTO FOOTER NOTE
                    ====================================================== */}
                    {!isEditing && (
                        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-500">
                                Keep your profile information up to date so your
                                HR team can reach you easily.
                            </p>

                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                            >
                                Update information
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* =============================================================
                AVATAR MODAL
            ============================================================= */}
            {showAvatarModal && hasAvatar && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                    onClick={() => {
                        if (!avatarUploading) {
                            setShowAvatarModal(false);
                        }
                    }}
                >
                    <div
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Profile photo
                                </h3>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    {getFullName()}
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={avatarUploading}
                                onClick={() => setShowAvatarModal(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Image */}
                        <div className="flex min-h-[300px] items-center justify-center bg-slate-100 p-5 sm:min-h-[440px] sm:p-8">
                            <img
                                src={profile?.avatarUrl}
                                alt={`${getFullName()} profile`}
                                className="max-h-[55vh] max-w-full rounded-xl object-contain shadow-lg"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={avatarUploading}
                                onClick={handleAvatarDelete}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-medium text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                {avatarUploading
                                    ? "Removing..."
                                    : "Delete photo"}
                            </button>

                            <button
                                type="button"
                                disabled={avatarUploading}
                                onClick={() => avatarInputRef.current?.click()}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Upload className="h-4 w-4" />
                                {avatarUploading
                                    ? "Uploading..."
                                    : "Upload new photo"}
                            </button>
                        </div>

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => {
                                handleAvatarUpload(e.target.files?.[0]);
                                e.target.value = "";
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

/* ========================================================================
   EDIT PROFILE FORM
======================================================================== */

function EditProfileForm({
    formData,
    updateField,
    handleUpdate,
    onCancel,
}: {
    formData: {
        phone: string;
        address: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        bankName: string;
        bankAccountNo: string;
        bankIFSC: string;
    };
    updateField: (field: string, value: string) => void;
    handleUpdate: (e: React.FormEvent) => void;
    onCancel: () => void;
}) {
    return (
        <form onSubmit={handleUpdate} className="space-y-6">
            {/* Contact & Address */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SectionHeader
                    icon={<User className="h-4 w-4" />}
                    title="Personal information"
                    description="Update your contact and address details"
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
                    <FormField
                        label="Phone number"
                        value={formData.phone}
                        onChange={(value) => updateField("phone", value)}
                        placeholder="Enter phone number"
                        icon={<Phone />}
                    />

                    <FormField
                        label="Address"
                        value={formData.address}
                        onChange={(value) => updateField("address", value)}
                        placeholder="Enter street address"
                        icon={<MapPin />}
                    />

                    <FormField
                        label="City"
                        value={formData.city}
                        onChange={(value) => updateField("city", value)}
                        placeholder="Enter city"
                    />

                    <FormField
                        label="State"
                        value={formData.state}
                        onChange={(value) => updateField("state", value)}
                        placeholder="Enter state"
                    />

                    <FormField
                        label="Country"
                        value={formData.country}
                        onChange={(value) => updateField("country", value)}
                        placeholder="Enter country"
                    />

                    <FormField
                        label="Postal code"
                        value={formData.postalCode}
                        onChange={(value) => updateField("postalCode", value)}
                        placeholder="Enter postal code"
                    />
                </div>
            </section>

            {/* Banking */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SectionHeader
                    icon={<Landmark className="h-4 w-4" />}
                    title="Banking information"
                    description="Used for salary and direct deposit"
                    iconClass="bg-emerald-50 text-emerald-600"
                />

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3 sm:p-6">
                    <FormField
                        label="Bank name"
                        value={formData.bankName}
                        onChange={(value) => updateField("bankName", value)}
                        placeholder="Enter bank name"
                    />

                    <FormField
                        label="Account number"
                        value={formData.bankAccountNo}
                        onChange={(value) =>
                            updateField("bankAccountNo", value)
                        }
                        placeholder="Enter account number"
                    />

                    <FormField
                        label="IFSC code"
                        value={formData.bankIFSC}
                        onChange={(value) => updateField("bankIFSC", value)}
                        placeholder="Enter IFSC code"
                    />
                </div>

                <div className="mx-5 mb-5 flex gap-2 rounded-xl bg-amber-50 p-3 sm:mx-6 sm:mb-6">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                    <p className="text-xs leading-5 text-amber-700">
                        Make sure your banking information is correct before
                        saving. This information may be used for salary
                        payments.
                    </p>
                </div>
            </section>

            {/* Actions */}
            <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                    <X className="h-4 w-4" />
                    Cancel
                </button>

                <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                >
                    <Save className="h-4 w-4" />
                    Save changes
                </button>
            </div>
        </form>
    );
}

/* ========================================================================
   FORM FIELD
======================================================================== */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    icon,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {label}
            </label>

            <div className="relative">
                {icon && (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {React.cloneElement(
                            icon as React.ReactElement,
                            {
                                className: "h-4 w-4",
                            } as any,
                        )}
                    </div>
                )}

                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`h-11 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 ${
                        icon ? "pl-10 pr-3" : "px-3"
                    }`}
                />
            </div>
        </div>
    );
}

/* ========================================================================
   SECTION HEADER
======================================================================== */

function SectionHeader({
    icon,
    title,
    description,
    iconClass,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    iconClass: string;
}) {
    return (
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
            >
                {icon}
            </div>

            <div>
                <h3 className="text-sm font-semibold text-slate-900">
                    {title}
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            </div>
        </div>
    );
}

/* ========================================================================
   INFORMATION ITEM
======================================================================== */

function InfoItem({
    icon,
    label,
    value,
    valueClass = "text-slate-900",
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                {React.cloneElement(
                    icon as React.ReactElement,
                    {
                        className: "h-4 w-4",
                    } as any,
                )}
            </div>

            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {label}
                </p>

                <p
                    className={`mt-1 break-words text-sm font-medium ${valueClass}`}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

/* ========================================================================
   MINI INFORMATION
======================================================================== */

function MiniInfo({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span className="text-xs text-slate-500">{label}</span>

            <span className="max-w-[60%] text-right text-xs font-semibold text-slate-800">
                {value}
            </span>
        </div>
    );
}

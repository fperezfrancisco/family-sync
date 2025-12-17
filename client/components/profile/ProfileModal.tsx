"use client";

import React, { useState, useRef } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/utils/cropImage";
import {
  X,
  Edit3,
  Save,
  User,
  Calendar,
  Mail,
  Phone,
  Camera,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthAPI } from "@/lib/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Profile Modal Component
 *
 * Allows users to view and edit their profile information including:
 * - Basic details (name, email, date of birth, gender, phone)
 * - Profile avatar image
 * - Profile banner image
 *
 * Features:
 * - View mode: displays user information in a read-only format
 * - Edit mode: allows users to modify their profile details
 * - Image upload placeholders for avatar and banner (to be implemented)
 */
export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, refreshMe } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Image upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // To crop profile picture
  const [isCropping, setIsCropping] = useState(false);
  const [isCroppingBanner, setIsCroppingBanner] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropBanner, setCropBanner] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [zoomBanner, setZoomBanner] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppedAreaPixelsBanner, setCroppedAreaPixelsBanner] =
    useState<any>(null);

  // reader.onload = (e) => {
  //   setAvatarPreview(e.target?.result as string);
  //   setIsCropping(true);
  // };

  const applyCrop = async () => {
    if (!croppedAreaPixels || !avatarPreview) return;

    try {
      const croppedImg = await getCroppedImg(avatarPreview, croppedAreaPixels);

      // Update preview with the cropped version
      setAvatarPreview(croppedImg);

      // Convert base64 → File so backend receives the cropped image
      const file = await fetch(croppedImg)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new File([blob], "avatar.jpg", {
              type: "image/jpeg",
            })
        );

      setAvatarFile(file);

      // Close cropping UI
      setIsCropping(false);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  const applyCropBanner = async () => {
    if (!croppedAreaPixelsBanner || !bannerPreview) return;

    try {
      const croppedImg = await getCroppedImg(
        bannerPreview,
        croppedAreaPixelsBanner
      );

      // Update preview with the cropped version
      setBannerPreview(croppedImg);

      // Convert base64 → File so backend receives the cropped image
      const file = await fetch(croppedImg)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new File([blob], "banner.jpg", {
              type: "image/jpeg",
            })
        );

      setBannerFile(file);

      // Close cropping UI
      setIsCroppingBanner(false);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  // Format date for date input (YYYY-MM-DD format, timezone safe)
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      // Use local timezone offset to get the correct date
      const localDate = new Date(
        date.getTime() + date.getTimezoneOffset() * 60000
      );
      return localDate.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // Initialize form data with user data
  const getInitialFormData = () => ({
    name: user?.name || "",
    email: user?.email || "",
    dob: formatDateForInput(user?.dob),
    gender: user?.gender || "",
    phone: {
      countryCode: user?.phone?.countryCode || "",
      number: user?.phone?.number || "",
    },
  });

  const [formData, setFormData] = useState(getInitialFormData);

  // Profile update state
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Reset form data when entering edit mode
  const startEditing = () => {
    setFormData(getInitialFormData());
    setIsEditing(true);
    // Reset image upload state
    setAvatarFile(null);
    setAvatarPreview(null);
    setUploadError(null);
    setUploadSuccess(false);
    // Reset update state
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  // File validation
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return "Please select a valid image file (JPEG, PNG, or WebP)";
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    return null;
  };

  // Handle file selection
  const handleAvatarSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    setBannerFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerPreview(e.target?.result as string);
      setIsCroppingBanner(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarSelect(file);
    }
  };

  const handleBannerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBannerSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleAvatarSelect(file);
    }
  };

  const handleDropBanner = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleBannerSelect(file);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    console.log("Entered handle avatar upload", { avatarFile });
    if (!avatarFile) return;
    console.log("Avatar file exists.");

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await AuthAPI.uploadAvatar(avatarFile);
      console.log("✅ Avatar upload result:", result);
      setUploadSuccess(true);

      // Refresh user data to get updated avatar URL
      console.log("🔄 Starting refreshMe()...");
      await refreshMe();
      console.log("✅ refreshMe() complete");

      // Clear upload state after a short delay
      setTimeout(() => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setUploadSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("❌ Avatar upload failed:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerUpload = async () => {
    console.log("Entered handle banner upload", { bannerFile });
    if (!bannerFile) return;
    console.log("Banner file exists.");

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await AuthAPI.uploadBanner(bannerFile);
      console.log("✅ Banner upload result:", result);
      setUploadSuccess(true);

      // Refresh user data to get updated banner URL
      console.log("🔄 Starting refreshMe()...");
      await refreshMe();
      console.log("✅ refreshMe() complete");

      // Clear upload state after a short delay
      setTimeout(() => {
        setBannerFile(null);
        // setBannerPreview(null);
        setUploadSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("❌ Banner upload failed:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("phone.")) {
      const phoneField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        phone: {
          ...prev.phone,
          [phoneField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Handle form submission
  const handleSave = async () => {
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      // Upload avatar first if there's a new one
      if (avatarFile) {
        await handleAvatarUpload();
      }

      if (bannerFile) {
        await handleBannerUpload();
      }

      // Prepare update data (only send fields that aren't empty)
      const updateData: {
        name?: string;
        dob?: string;
        gender?: "male" | "female" | "other" | "";
        phone?: { countryCode: string; number: string };
      } = {};

      if (formData.name && formData.name !== user?.name) {
        updateData.name = formData.name;
      }

      if (formData.dob && formData.dob !== user?.dob) {
        updateData.dob = formData.dob;
      }

      if (formData.gender !== user?.gender) {
        updateData.gender = formData.gender as "male" | "female" | "other" | "";
      }

      if (
        (formData.phone.countryCode || formData.phone.number) &&
        (formData.phone.countryCode !== user?.phone?.countryCode ||
          formData.phone.number !== user?.phone?.number)
      ) {
        updateData.phone = formData.phone;
      }

      // Only call API if there are changes
      if (Object.keys(updateData).length > 0) {
        const response = await AuthAPI.updateProfile(updateData);

        if (response.success) {
          setUpdateSuccess(true);
          // Refresh user data to get updated information
          await refreshMe();

          // Exit edit mode after successful update
          setTimeout(() => {
            setIsEditing(false);
            setUpdateSuccess(false);
          }, 1500);
        } else {
          throw new Error(response.message || "Failed to update profile");
        }
      } else {
        // No changes made, just exit edit mode
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    // Reset form data to original user data
    setFormData(getInitialFormData());
    setIsEditing(false);
    // Reset image upload state
    setAvatarFile(null);
    setAvatarPreview(null);
    setBannerFile(null);
    setBannerPreview(null);
    setUploadError(null);
    setUploadSuccess(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not provided";
    try {
      const date = new Date(dateString);
      // Use local timezone offset to get the correct date for display
      const localDate = new Date(
        date.getTime() + date.getTimezoneOffset() * 60000
      );
      return localDate.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {isCropping && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-6">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="relative w-full h-64 bg-black/10">
              <Cropper
                image={avatarPreview!}
                crop={crop}
                zoom={zoom}
                aspect={4 / 4}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                restrictPosition={false}
                onCropComplete={(croppedArea, croppedPixels) =>
                  setCroppedAreaPixels(croppedPixels)
                }
              />
              <div className="mt-4">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setIsCropping(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={applyCrop}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {isCroppingBanner && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-6">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="relative w-full h-64 bg-black/10">
              <Cropper
                image={bannerPreview!}
                crop={cropBanner}
                zoom={zoomBanner}
                aspect={16 / 9}
                onCropChange={setCropBanner}
                onZoomChange={setZoomBanner}
                restrictPosition={false}
                onCropComplete={(croppedArea, croppedPixels) =>
                  setCroppedAreaPixelsBanner(croppedPixels)
                }
              />
              <div className="mt-4">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoomBanner}
                  onChange={(e) => setZoomBanner(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setIsCroppingBanner(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={applyCropBanner}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--card)] rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {isEditing ? "Edit Profile" : "Profile"}
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isUpdating ? "Saving..." : "Save"}</span>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--accent)] rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Banner Section */}
          <div className="relative">
            {/* Profile Banner */}
            <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              ) : user?.banner?.fullSize || user?.bannerUrl ? (
                <img
                  src={user.banner?.fullSize || user.bannerUrl}
                  alt="Current banner"
                  className="w-full h-full object-cover"
                />
              ) : null}
              {isEditing && (
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
              {!isEditing && (
                <div className="absolute bottom-2 right-2 text-xs text-white/80">
                  Click edit to change banner
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="absolute -bottom-8 left-6">
              <div className="relative">
                <div className="w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center border-4 border-[var(--card)] overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.avatar?.small || user?.avatarUrl ? (
                    <img
                      src={user.avatar?.small || user.avatarUrl}
                      alt="Current avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-[var(--primary-foreground)]">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-full text-[var(--primary-foreground)] transition-colors"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="mt-12 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                <User className="inline h-4 w-4 mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="px-3 py-2 text-[var(--foreground)] bg-(--muted)/20 dark:bg-[var(--muted)]/50 rounded-lg">
                  {user?.name || "Not provided"}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Email Address
              </label>
              <div className="px-3 py-2 text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg">
                {user?.email || "Not provided"}
                <span className="text-xs block mt-1">
                  Email cannot be changed
                </span>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              ) : (
                <div className="px-3 py-2 text-[var(--foreground)] bg-(--muted)/20 dark:bg-[var(--muted)]/50 rounded-lg">
                  {formatDate(user?.dob || "")}
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Gender
              </label>
              {isEditing ? (
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <div className="px-3 py-2 text-[var(--foreground)] bg-(--muted)/20 dark:bg-[var(--muted)]/50 rounded-lg">
                  {user?.gender
                    ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
                    : "Not provided"}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                Phone Number
              </label>
              {isEditing ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.phone.countryCode}
                    onChange={(e) =>
                      handleInputChange("phone.countryCode", e.target.value)
                    }
                    className="w-20 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder="+1"
                  />
                  <input
                    type="text"
                    value={formData.phone.number}
                    onChange={(e) =>
                      handleInputChange("phone.number", e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>
              ) : (
                <div className="px-3 py-2 text-[var(--foreground)] bg-(--muted)/20 dark:bg-[var(--muted)]/50 rounded-lg">
                  {user?.phone?.countryCode && user?.phone?.number
                    ? `${user.phone.countryCode} ${user.phone.number}`
                    : "Not provided"}
                </div>
              )}
            </div>

            {/* Success/Error Messages */}
            {isEditing && (updateSuccess || updateError) && (
              <div className="pt-4 border-t border-[var(--border)]">
                {updateSuccess && (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-800 rounded-lg border border-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Profile updated successfully!
                    </span>
                  </div>
                )}
                {updateError && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{updateError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Image Upload Section */}
            {isEditing && (
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Profile Avatar
                  </label>

                  {/* Hidden file input */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Upload area */}
                  <div
                    className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--primary)] transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <div className="space-y-3">
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-20 h-20 object-cover rounded-full mx-auto border-2 border-[var(--border)]"
                        />
                        <p className="text-sm text-[var(--foreground)]">
                          {avatarFile?.name}
                        </p>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAvatarUpload();
                            }}
                            disabled={isUploading}
                            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            <span>
                              {isUploading ? "Uploading..." : "Upload"}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAvatarFile(null);
                              setAvatarPreview(null);
                              setUploadError(null);
                            }}
                            className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="h-8 w-8 mx-auto text-[var(--muted-foreground)]" />
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          JPEG, PNG or WebP (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload status messages */}
                  {uploadError && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Avatar updated successfully!</span>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Profile Banner
                  </label>

                  {/* Hidden file input */}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleBannerInputChange}
                    className="hidden"
                  />

                  {/* Upload area */}
                  <div
                    className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--primary)] transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDropBanner}
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {bannerPreview ? (
                      <div className="space-y-3">
                        <img
                          src={bannerPreview}
                          alt="Banner preview"
                          className="w-20 h-20 object-cover rounded-full mx-auto border-2 border-[var(--border)]"
                        />
                        <p className="text-sm text-[var(--foreground)]">
                          {bannerFile?.name}
                        </p>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBannerUpload();
                            }}
                            disabled={isUploading}
                            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            <span>
                              {isUploading ? "Uploading..." : "Upload"}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBannerFile(null);
                              setBannerPreview(null);
                              setUploadError(null);
                            }}
                            className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="h-8 w-8 mx-auto text-[var(--muted-foreground)]" />
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          JPEG, PNG or WebP (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload status messages */}
                  {uploadError && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Banner updated successfully!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

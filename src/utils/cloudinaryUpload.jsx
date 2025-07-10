// utils/cloudinaryUpload.js

export const uploadToCloudinary = async (file, type) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "uploads"); // ✅ your actual unsigned preset name
  formData.append("folder", "journey_planner/admin_updates"); // ✅ correct Cloudinary folder

  const cloudName = "dq8z64kam"; // ✅ your Cloudinary cloud name

  try {
    const resourceType = type === "audio" ? "raw" : type; // ✅ handle audio as raw
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data.secure_url) {
      throw new Error(data.error?.message || "Upload failed");
    }

    return data.secure_url; // ✅ The uploaded file's URL
  } catch (err) {
    console.error("Upload error:", err);
    return "";
  }
};

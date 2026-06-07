import { cloudinary } from "../../config/cloudinary.js";

export async function uploadImageBuffer(args: { buffer: Buffer; folder: string; publicId?: string }) {
  const base64 = args.buffer.toString("base64");
  const dataUri = `data:image/jpeg;base64,${base64}`;

  const res = await cloudinary.uploader.upload(dataUri, {
    folder: args.folder,
    public_id: args.publicId,
    resource_type: "image",
  });

  return { url: res.secure_url, publicId: res.public_id } as const;
}

export async function deleteByPublicId(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}


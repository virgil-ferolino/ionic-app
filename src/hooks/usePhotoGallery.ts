import { useEffect, useState } from "react";
import { Camera, CameraDirection, MediaResult } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";

import { isPlatform } from "@ionic/react";
import { Capacitor } from "@capacitor/core";

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}

export const usePhotoGallery = () => {
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const PHOTO_STORAGE = "photos";

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const { value } = await Preferences.get({
          key: PHOTO_STORAGE,
        });

        const savedPhotos = (value ? JSON.parse(value) : []) as UserPhoto[];

        const loadedPhotos = await Promise.all(
          savedPhotos.map(async (photo) => {
            if (Capacitor.isNativePlatform()) {
              const fileUri = await Filesystem.getUri({
                path: photo.filepath,
                directory: Directory.Data,
              });

              return {
                ...photo,
                webviewPath: Capacitor.convertFileSrc(fileUri.uri),
              };
            }

            return photo;
          }),
        );

        setPhotos(loadedPhotos);
      } catch (error) {
        console.error("Failed to load saved photos:", error);
      }
    };

    loadSaved();
  }, []);

  const base64fromPath = async (path: string): Promise<string> => {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.readAsDataURL(blob);
    });
  };

  const savePhoto = async (
    photo: MediaResult,
    filename: string,
  ): Promise<UserPhoto> => {
    let base64Data: string | Blob;

    if (isPlatform("hybrid")) {
      const file = await Filesystem.readFile({
        path: photo.uri!,
      });
      base64Data =
        typeof file.data === "string" ? file.data : await file.data.text();
    } else {
      base64Data = await base64fromPath(photo.webPath!);
    }

    const savedFile = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Data,
    });

    if (isPlatform("hybrid")) {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      return {
        filepath: filename,
        webviewPath: photo.webPath,
      };
    }
  };

  const deletePhoto = async (photo: UserPhoto) => {
    const newPhotos = photos.filter((p) => p.filepath !== photo.filepath);

    Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });

    const filename = photo.filepath.slice(photo.filepath.lastIndexOf("/") + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });

    setPhotos(newPhotos);
  };

  const addNewPhotoToGallery = async () => {
    try {
      const capturedPhoto = await Camera.takePhoto({
        quality: 90,
        editable: "in-app",
        cameraDirection: CameraDirection.Rear,
        targetWidth: 1280,
        targetHeight: 720,
      });

      console.log("Captured photo:", capturedPhoto);

      const filename = `${Date.now()}.jpeg`;

      const savedPhoto = await savePhoto(capturedPhoto, filename);

      setPhotos((currentPhotos) => {
        const updatedPhotos = [savedPhoto, ...currentPhotos];

        Preferences.set({
          key: PHOTO_STORAGE,
          value: JSON.stringify(updatedPhotos),
        }).catch(console.error);

        return updatedPhotos;
      });
    } catch (error) {
      console.error("Failed to capture or save photo:", error);
    }
  };

  return {
    addNewPhotoToGallery,
    photos,
    deletePhoto,
  };
};

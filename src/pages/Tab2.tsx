import { useState } from "react";
import {
  IonActionSheet,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonHeader,
  IonIcon,
  IonPage,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { camera } from "ionicons/icons";
import { usePhotoGallery, UserPhoto } from "../hooks/usePhotoGallery";
import "./Tab2.css";

const Tab2: React.FC = () => {
  const { addNewPhotoToGallery, photos, deletePhoto } = usePhotoGallery();
  const [photoToDelete, setPhotoToDelete] = useState<UserPhoto>();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Photo Gallery</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Photo Gallery</IonTitle>
          </IonToolbar>
        </IonHeader>

        {photos.length !== 0 && (
          <IonGrid>
            <IonRow>
              {photos.map((photo, index) => (
                <IonCol size="4" key={index}>
                  <button onClick={() => setPhotoToDelete(photo)}>
                    <img
                      src={photo.webviewPath}
                      alt={`Photo ${index + 1}`}
                      loading="lazy"
                    />
                  </button>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

        {photos.length === 0 && (
          <p>
            <IonText className="ion-text-center">No photos available.</IonText>
          </p>
        )}

        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={addNewPhotoToGallery}>
            <IonIcon icon={camera} />
          </IonFabButton>
        </IonFab>

        <IonActionSheet
          isOpen={!!photoToDelete}
          buttons={[
            {
              text: "Delete",
              role: "destructive",
              icon: "trash",
              handler: () => {
                if (photoToDelete) {
                  deletePhoto(photoToDelete);
                  setPhotoToDelete(undefined);
                }
              },
            },
          ]}
          onDidDismiss={() => setPhotoToDelete(undefined)}
        ></IonActionSheet>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;

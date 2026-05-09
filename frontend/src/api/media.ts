import { apiClient } from '../lib/api';
import type { Photo } from '../types/api';

export const mediaApi = {
  listPhotos: (unitName: string) =>
    apiClient.get<Photo[]>(`/pwbunits/${unitName}/photos/`).then((r) => r.data),

  uploadPhoto: (unitName: string, file: File, isMain = false) => {
    const form = new FormData();
    form.append('image', file);
    form.append('is_main', String(isMain));
    return apiClient
      .post<Photo>(`/pwbunits/${unitName}/photos/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  setMainPhoto: (unitName: string, photoId: number) =>
    apiClient
      .patch<Photo>(`/pwbunits/${unitName}/photos/${photoId}/`, { is_main: 'true' })
      .then((r) => r.data),

  deletePhoto: (unitName: string, photoId: number) =>
    apiClient.delete(`/pwbunits/${unitName}/photos/${photoId}/`).then((r) => r.data),

  uploadPdfResume: (unitName: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<{ pdf_resume: string }>(`/pwbunits/${unitName}/pdf-resume/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  deletePdfResume: (unitName: string) =>
    apiClient.delete(`/pwbunits/${unitName}/pdf-resume/`).then((r) => r.data),

  uploadEducationImage: (unitName: string, educationId: number, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient
      .post<{ image: string }>(
        `/pwbunits/${unitName}/education-units/${educationId}/image/`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then((r) => r.data);
  },

  deleteEducationImage: (unitName: string, educationId: number) =>
    apiClient
      .delete(`/pwbunits/${unitName}/education-units/${educationId}/image/`)
      .then((r) => r.data),

  uploadPortfolioImage: (unitName: string, itemId: number, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient
      .post<{ image: string }>(
        `/pwbunits/${unitName}/portfolio-items/${itemId}/image/`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then((r) => r.data);
  },

  deletePortfolioImage: (unitName: string, itemId: number) =>
    apiClient
      .delete(`/pwbunits/${unitName}/portfolio-items/${itemId}/image/`)
      .then((r) => r.data),

  uploadCertificationImage: (unitName: string, certId: number, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient
      .post<{ image: string }>(
        `/pwbunits/${unitName}/certifications/${certId}/image/`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then((r) => r.data);
  },

  deleteCertificationImage: (unitName: string, certId: number) =>
    apiClient
      .delete(`/pwbunits/${unitName}/certifications/${certId}/image/`)
      .then((r) => r.data),
};

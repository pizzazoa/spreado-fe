import apiClient from './apiClient';
import type { NoteResponse } from '../types';

export const noteService = {
  getNoteDetail: async (noteId: number): Promise<NoteResponse> => {
    const response = await apiClient.get<NoteResponse>(`/note/${noteId}`);
    return response.data;
  },
};

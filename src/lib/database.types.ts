import type { ComplaintStatus, UserRole } from "@/lib/enums";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      wards: {
        Row: { id: string; number: number; name_ta: string; name_en: string | null; is_active: boolean; created_at: string };
        Insert: { id?: string; number: number; name_ta: string; name_en?: string | null; is_active?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["wards"]["Insert"]>;
        Relationships: [];
      };
      area_pocs: {
        Row: { id: string; ward_id: string; name: string; phone: string; area_name: string; is_active: boolean; created_at: string };
        Insert: { id?: string; ward_id: string; name: string; phone: string; area_name: string; is_active?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["area_pocs"]["Insert"]>;
        Relationships: [];
      };
      complaint_categories: {
        Row: { id: string; name_ta: string; name_en: string | null; slug: string; is_active: boolean; created_at: string };
        Insert: { id?: string; name_ta: string; name_en?: string | null; slug: string; is_active?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["complaint_categories"]["Insert"]>;
        Relationships: [];
      };
      complaints: {
        Row: {
          id: string;
          tracking_id: string;
          ward_id: string;
          category_id: string;
          complainant_name: string;
          complainant_phone: string;
          complainant_email: string | null;
          area_name: string;
          address: string;
          gps_latitude: number | null;
          gps_longitude: number | null;
          title: string;
          description: string;
          status: ComplaintStatus;
          priority: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          tracking_id?: string;
          ward_id: string;
          category_id: string;
          complainant_name: string;
          complainant_phone: string;
          complainant_email?: string | null;
          area_name: string;
          address: string;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          title: string;
          description: string;
          status?: ComplaintStatus;
          priority?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["complaints"]["Insert"]>;
        Relationships: [];
      };
      complaint_media: {
        Row: { id: string; complaint_id: string; bucket: string; path: string; mime_type: string; size_bytes: number; uploaded_by: string | null; created_at: string };
        Insert: { id?: string; complaint_id: string; bucket: string; path: string; mime_type: string; size_bytes: number; uploaded_by?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["complaint_media"]["Insert"]>;
        Relationships: [];
      };
      complaint_status_history: {
        Row: { id: string; complaint_id: string; from_status: ComplaintStatus | null; to_status: ComplaintStatus; note: string | null; changed_by: string | null; created_at: string };
        Insert: { id?: string; complaint_id: string; from_status?: ComplaintStatus | null; to_status: ComplaintStatus; note?: string | null; changed_by?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["complaint_status_history"]["Insert"]>;
        Relationships: [];
      };
      complaint_assignments: {
        Row: { id: string; complaint_id: string; assigned_to: string; assigned_by: string | null; note: string | null; assigned_at: string; closed_at: string | null };
        Insert: { id?: string; complaint_id: string; assigned_to: string; assigned_by?: string | null; note?: string | null; assigned_at?: string; closed_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["complaint_assignments"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          username: string | null;
          password_hash: string | null;
          full_name: string;
          phone: string | null;
          role: UserRole;
          ward_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username?: string | null;
          password_hash?: string | null;
          full_name: string;
          phone?: string | null;
          role: UserRole;
          ward_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      ward_contacts: {
        Row: { id: string; ward_id: string; name: string; designation_ta: string; phone: string; is_primary: boolean; created_at: string };
        Insert: { id?: string; ward_id: string; name: string; designation_ta: string; phone: string; is_primary?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["ward_contacts"]["Insert"]>;
        Relationships: [];
      };
      banners: {
        Row: { id: string; title_ta: string; image_path: string | null; link_url: string | null; is_active: boolean; starts_at: string | null; ends_at: string | null; created_at: string };
        Insert: { id?: string; title_ta: string; image_path?: string | null; link_url?: string | null; is_active?: boolean; starts_at?: string | null; ends_at?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["banners"]["Insert"]>;
        Relationships: [];
      };
      announcements: {
        Row: { id: string; title_ta: string; body_ta: string; is_active: boolean; published_at: string | null; created_at: string };
        Insert: { id?: string; title_ta: string; body_ta: string; is_active?: boolean; published_at?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      complaint_status: ComplaintStatus;
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

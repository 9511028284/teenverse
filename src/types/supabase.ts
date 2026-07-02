export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academy_quizzes: {
        Row: {
          category: string
          created_at: string | null
          id: string
          quiz_data: Json
          sub_category: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          quiz_data: Json
          sub_category: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          quiz_data?: Json
          sub_category?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      ai_usage_limits: {
        Row: {
          created_at: string
          feature: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          period_end: string
          period_start: string
          period_type: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          sub_category: string | null
          success: boolean | null
          type: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          sub_category?: string | null
          success?: boolean | null
          type: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          sub_category?: string | null
          success?: boolean | null
          type?: string
        }
        Relationships: []
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "opportunity_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_check_issues: Json
          ai_check_reason: string | null
          ai_check_score: number | null
          ai_check_status: string | null
          ai_check_suggestions: Json
          ai_checked_at: string | null
          ai_second_check_required: boolean
          bid_amount: number | null
          client_id: string
          client_rating: number | null
          client_review_tags: string[] | null
          completed_at: string | null
          cover_letter: string | null
          created_at: string | null
          escrow_order_id: string | null
          freelancer_amount: number | null
          freelancer_email: string
          freelancer_id: string
          freelancer_name: string
          freelancer_phone: string | null
          id: number
          invoice_path: string | null
          is_educational_waiver_signed: boolean | null
          is_escrow_held: boolean | null
          is_escrow_terms_agreed: boolean | null
          job_id: number
          paid_at: string | null
          payment_id: string | null
          payment_status: string | null
          platform_fee: number | null
          rejection_reason: string | null
          revision_count: number | null
          revision_message: string | null
          started_at: string | null
          status: string | null
          submitted_at: string | null
          transaction_id: string | null
          updated_at: string | null
          wallet_deduction: number | null
          work_files: string[] | null
          work_link: string | null
          work_message: string | null
        }
        Insert: {
          ai_check_issues?: Json
          ai_check_reason?: string | null
          ai_check_score?: number | null
          ai_check_status?: string | null
          ai_check_suggestions?: Json
          ai_checked_at?: string | null
          ai_second_check_required?: boolean
          bid_amount?: number | null
          client_id: string
          client_rating?: number | null
          client_review_tags?: string[] | null
          completed_at?: string | null
          cover_letter?: string | null
          created_at?: string | null
          escrow_order_id?: string | null
          freelancer_amount?: number | null
          freelancer_email: string
          freelancer_id: string
          freelancer_name: string
          freelancer_phone?: string | null
          id?: number
          invoice_path?: string | null
          is_educational_waiver_signed?: boolean | null
          is_escrow_held?: boolean | null
          is_escrow_terms_agreed?: boolean | null
          job_id: number
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          rejection_reason?: string | null
          revision_count?: number | null
          revision_message?: string | null
          started_at?: string | null
          status?: string | null
          submitted_at?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          wallet_deduction?: number | null
          work_files?: string[] | null
          work_link?: string | null
          work_message?: string | null
        }
        Update: {
          ai_check_issues?: Json
          ai_check_reason?: string | null
          ai_check_score?: number | null
          ai_check_status?: string | null
          ai_check_suggestions?: Json
          ai_checked_at?: string | null
          ai_second_check_required?: boolean
          bid_amount?: number | null
          client_id?: string
          client_rating?: number | null
          client_review_tags?: string[] | null
          completed_at?: string | null
          cover_letter?: string | null
          created_at?: string | null
          escrow_order_id?: string | null
          freelancer_amount?: number | null
          freelancer_email?: string
          freelancer_id?: string
          freelancer_name?: string
          freelancer_phone?: string | null
          id?: number
          invoice_path?: string | null
          is_educational_waiver_signed?: boolean | null
          is_escrow_held?: boolean | null
          is_escrow_terms_agreed?: boolean | null
          job_id?: number
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          rejection_reason?: string | null
          revision_count?: number | null
          revision_message?: string | null
          started_at?: string | null
          status?: string | null
          submitted_at?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          wallet_deduction?: number | null
          work_files?: string[] | null
          work_link?: string | null
          work_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_client_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_freelancer_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_freelancer_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: number | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: number | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: number | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          action: string
          created_at: string
          id: number
          rate_key: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: never
          rate_key: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: never
          rate_key?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          description: string | null
          icon: string
          name: string
          xp_reward: number | null
        }
        Insert: {
          category: string
          description?: string | null
          icon: string
          name: string
          xp_reward?: number | null
        }
        Update: {
          category?: string
          description?: string | null
          icon?: string
          name?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          business_name: string
          business_type: string
          can_post: boolean
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          location: string | null
          rejection_reason: string | null
          updated_at: string
          user_id: string
          verification_status: string
          verified_at: string | null
          website: string | null
        }
        Insert: {
          business_name: string
          business_type?: string
          can_post?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          location?: string | null
          rejection_reason?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          business_name?: string
          business_type?: string
          can_post?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          location?: string | null
          rejection_reason?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          badges: string[] | null
          bio: string | null
          created_at: string | null
          email: string
          id: string
          id_proof_url: string | null
          is_bank_linked: boolean | null
          is_kyc_verified: boolean | null
          is_organisation: string | null
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_status: string | null
          kyc_submitted_at: string | null
          kyc_timestamp: string | null
          kyc_type: string | null
          name: string
          nationality: string | null
          phone: string | null
          phone_verified: boolean | null
          pincode: string | null
          project_duration: string | null
          referral_code: string | null
          referred_by: string | null
          requirements: string | null
          social_links: Json | null
          source: string | null
          state: string | null
          status: string | null
          wallet_balance: number | null
        }
        Insert: {
          badges?: string[] | null
          bio?: string | null
          created_at?: string | null
          email: string
          id: string
          id_proof_url?: string | null
          is_bank_linked?: boolean | null
          is_kyc_verified?: boolean | null
          is_organisation?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          kyc_timestamp?: string | null
          kyc_type?: string | null
          name: string
          nationality?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          pincode?: string | null
          project_duration?: string | null
          referral_code?: string | null
          referred_by?: string | null
          requirements?: string | null
          social_links?: Json | null
          source?: string | null
          state?: string | null
          status?: string | null
          wallet_balance?: number | null
        }
        Update: {
          badges?: string[] | null
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          id_proof_url?: string | null
          is_bank_linked?: boolean | null
          is_kyc_verified?: boolean | null
          is_organisation?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          kyc_timestamp?: string | null
          kyc_type?: string | null
          name?: string
          nationality?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          pincode?: string | null
          project_duration?: string | null
          referral_code?: string | null
          referred_by?: string | null
          requirements?: string | null
          social_links?: Json | null
          source?: string | null
          state?: string | null
          status?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      consistency_flags: {
        Row: {
          code: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consistency_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "consistency_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_reward_claims: {
        Row: {
          amount: number
          claimed_at: string
          context: string
          id: number
          reward_type: string
          user_id: string
        }
        Insert: {
          amount: number
          claimed_at?: string
          context?: string
          id?: number
          reward_type: string
          user_id: string
        }
        Update: {
          amount?: number
          claimed_at?: string
          context?: string
          id?: number
          reward_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_reward_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "energy_reward_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_orders: {
        Row: {
          app_id: number | null
          bid_amount: number
          client_id: string | null
          created_at: string | null
          freelancer_id: string | null
          id: string
          status: string | null
          updated_at: string | null
          wallet_deduction: number | null
        }
        Insert: {
          app_id?: number | null
          bid_amount: number
          client_id?: string | null
          created_at?: string | null
          freelancer_id?: string | null
          id: string
          status?: string | null
          updated_at?: string | null
          wallet_deduction?: number | null
        }
        Update: {
          app_id?: number | null
          bid_amount?: number
          client_id?: string | null
          created_at?: string | null
          freelancer_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          wallet_deduction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_orders_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_orders_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "platform_verified_resume_work"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "escrow_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_orders_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "escrow_orders_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
          message: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
        }
        Relationships: []
      }
      freelancers: {
        Row: {
          account_number: string | null
          account_number_hash: string | null
          account_number_last4: string | null
          age: number | null
          badges: string[] | null
          bank_name: string | null
          bidding_restricted: boolean | null
          bids_remaining: number | null
          bio: string | null
          commission_rate: number | null
          completion_rate: number | null
          consistency_flags: Json | null
          cover_image: string | null
          created_at: string | null
          current_active_jobs: number | null
          current_plan: string | null
          dob: string | null
          email: string
          energy_points: number | null
          gender: string | null
          guardian_account_number: string | null
          guardian_account_number_hash: string | null
          guardian_account_number_last4: string | null
          guardian_bank_name: string | null
          guardian_ifsc_code: string | null
          guardian_name: string | null
          guardian_pan: string | null
          guardian_pan_hash: string | null
          guardian_pan_last4: string | null
          guardian_upi: string | null
          hourly_rate: number | null
          id: string
          id_proof_url: string | null
          ifsc_code: string | null
          is_available_for_urgent: boolean | null
          is_bank_linked: boolean | null
          is_kyc_verified: boolean | null
          is_minor: boolean | null
          is_parent_verified: boolean | null
          journey_statement: string | null
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_status: string | null
          kyc_submitted_at: string | null
          kyc_timestamp: string | null
          kyc_type: string | null
          last_login_date: string | null
          max_active_jobs: number | null
          name: string
          nationality: string | null
          pan_hash: string | null
          pan_last4: string | null
          parent_consent_ip: string | null
          parent_consent_timestamp: string | null
          parent_consent_user_agent: string | null
          parent_consent_verified: boolean | null
          parent_consent_version: string | null
          parent_details: Json | null
          parent_email: string | null
          parent_mode: boolean | null
          payout_blocked: boolean | null
          payout_review_required: boolean | null
          phone: string | null
          phone_verified: boolean | null
          pincode: string | null
          plan_expires_at: string | null
          projects: string | null
          qualification: string | null
          rating: number | null
          referral_code: string | null
          referred_by: string | null
          response_speed_hours: number | null
          resume_url: string | null
          resumes_remaining: number | null
          risk_level: string | null
          services: string | null
          social_links: Json | null
          source: string | null
          specialty: string | null
          state: string | null
          status: string | null
          tag_line: string | null
          total_jobs: number | null
          trust_score: number | null
          trust_score_breakdown: Json | null
          unlocked_skills: Json | null
          upi: string | null
          visibility_multiplier: number | null
          wallet_balance: number | null
          working_time: string | null
        }
        Insert: {
          account_number?: string | null
          account_number_hash?: string | null
          account_number_last4?: string | null
          age?: number | null
          badges?: string[] | null
          bank_name?: string | null
          bidding_restricted?: boolean | null
          bids_remaining?: number | null
          bio?: string | null
          commission_rate?: number | null
          completion_rate?: number | null
          consistency_flags?: Json | null
          cover_image?: string | null
          created_at?: string | null
          current_active_jobs?: number | null
          current_plan?: string | null
          dob?: string | null
          email: string
          energy_points?: number | null
          gender?: string | null
          guardian_account_number?: string | null
          guardian_account_number_hash?: string | null
          guardian_account_number_last4?: string | null
          guardian_bank_name?: string | null
          guardian_ifsc_code?: string | null
          guardian_name?: string | null
          guardian_pan?: string | null
          guardian_pan_hash?: string | null
          guardian_pan_last4?: string | null
          guardian_upi?: string | null
          hourly_rate?: number | null
          id: string
          id_proof_url?: string | null
          ifsc_code?: string | null
          is_available_for_urgent?: boolean | null
          is_bank_linked?: boolean | null
          is_kyc_verified?: boolean | null
          is_minor?: boolean | null
          is_parent_verified?: boolean | null
          journey_statement?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          kyc_timestamp?: string | null
          kyc_type?: string | null
          last_login_date?: string | null
          max_active_jobs?: number | null
          name: string
          nationality?: string | null
          pan_hash?: string | null
          pan_last4?: string | null
          parent_consent_ip?: string | null
          parent_consent_timestamp?: string | null
          parent_consent_user_agent?: string | null
          parent_consent_verified?: boolean | null
          parent_consent_version?: string | null
          parent_details?: Json | null
          parent_email?: string | null
          parent_mode?: boolean | null
          payout_blocked?: boolean | null
          payout_review_required?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          pincode?: string | null
          plan_expires_at?: string | null
          projects?: string | null
          qualification?: string | null
          rating?: number | null
          referral_code?: string | null
          referred_by?: string | null
          response_speed_hours?: number | null
          resume_url?: string | null
          resumes_remaining?: number | null
          risk_level?: string | null
          services?: string | null
          social_links?: Json | null
          source?: string | null
          specialty?: string | null
          state?: string | null
          status?: string | null
          tag_line?: string | null
          total_jobs?: number | null
          trust_score?: number | null
          trust_score_breakdown?: Json | null
          unlocked_skills?: Json | null
          upi?: string | null
          visibility_multiplier?: number | null
          wallet_balance?: number | null
          working_time?: string | null
        }
        Update: {
          account_number?: string | null
          account_number_hash?: string | null
          account_number_last4?: string | null
          age?: number | null
          badges?: string[] | null
          bank_name?: string | null
          bidding_restricted?: boolean | null
          bids_remaining?: number | null
          bio?: string | null
          commission_rate?: number | null
          completion_rate?: number | null
          consistency_flags?: Json | null
          cover_image?: string | null
          created_at?: string | null
          current_active_jobs?: number | null
          current_plan?: string | null
          dob?: string | null
          email?: string
          energy_points?: number | null
          gender?: string | null
          guardian_account_number?: string | null
          guardian_account_number_hash?: string | null
          guardian_account_number_last4?: string | null
          guardian_bank_name?: string | null
          guardian_ifsc_code?: string | null
          guardian_name?: string | null
          guardian_pan?: string | null
          guardian_pan_hash?: string | null
          guardian_pan_last4?: string | null
          guardian_upi?: string | null
          hourly_rate?: number | null
          id?: string
          id_proof_url?: string | null
          ifsc_code?: string | null
          is_available_for_urgent?: boolean | null
          is_bank_linked?: boolean | null
          is_kyc_verified?: boolean | null
          is_minor?: boolean | null
          is_parent_verified?: boolean | null
          journey_statement?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          kyc_timestamp?: string | null
          kyc_type?: string | null
          last_login_date?: string | null
          max_active_jobs?: number | null
          name?: string
          nationality?: string | null
          pan_hash?: string | null
          pan_last4?: string | null
          parent_consent_ip?: string | null
          parent_consent_timestamp?: string | null
          parent_consent_user_agent?: string | null
          parent_consent_verified?: boolean | null
          parent_consent_version?: string | null
          parent_details?: Json | null
          parent_email?: string | null
          parent_mode?: boolean | null
          payout_blocked?: boolean | null
          payout_review_required?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          pincode?: string | null
          plan_expires_at?: string | null
          projects?: string | null
          qualification?: string | null
          rating?: number | null
          referral_code?: string | null
          referred_by?: string | null
          response_speed_hours?: number | null
          resume_url?: string | null
          resumes_remaining?: number | null
          risk_level?: string | null
          services?: string | null
          social_links?: Json | null
          source?: string | null
          specialty?: string | null
          state?: string | null
          status?: string | null
          tag_line?: string | null
          total_jobs?: number | null
          trust_score?: number | null
          trust_score_breakdown?: Json | null
          unlocked_skills?: Json | null
          upi?: string | null
          visibility_multiplier?: number | null
          wallet_balance?: number | null
          working_time?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          attachments: string[] | null
          budget: number
          category: string | null
          client_id: string
          client_name: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          duration: string | null
          hired_freelancer_id: string | null
          id: number
          is_archived: boolean | null
          is_elite: boolean | null
          job_type: string | null
          tags: string | null
          title: string
        }
        Insert: {
          attachments?: string[] | null
          budget: number
          category?: string | null
          client_id: string
          client_name: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          hired_freelancer_id?: string | null
          id?: number
          is_archived?: boolean | null
          is_elite?: boolean | null
          job_type?: string | null
          tags?: string | null
          title: string
        }
        Update: {
          attachments?: string[] | null
          budget?: number
          category?: string | null
          client_id?: string
          client_name?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          duration?: string | null
          hired_freelancer_id?: string | null
          id?: number
          is_archived?: boolean | null
          is_elite?: boolean | null
          job_type?: string | null
          tags?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_hired_freelancer_id_fkey"
            columns: ["hired_freelancer_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_hired_freelancer_id_fkey"
            columns: ["hired_freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_status: {
        Row: {
          age_group: string | null
          metadata: Json | null
          provider: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          age_group?: string | null
          metadata?: Json | null
          provider?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          age_group?: string | null
          metadata?: Json | null
          provider?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          application_id: number | null
          client_temp_id: string | null
          content: string
          created_at: string | null
          file_name: string | null
          file_url: string | null
          id: number
          receiver_id: string
          sender_id: string
        }
        Insert: {
          application_id?: number | null
          client_temp_id?: string | null
          content: string
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: number
          receiver_id: string
          sender_id: string
        }
        Update: {
          application_id?: number | null
          client_temp_id?: string | null
          content?: string
          created_at?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: number
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "platform_verified_resume_work"
            referencedColumns: ["application_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          message: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          application_deadline: string | null
          business_id: string
          created_at: string
          currency: string
          description: string
          duration: string | null
          id: string
          is_paid: boolean
          location: string | null
          published_at: string | null
          rejection_reason: string | null
          skills_required: string[]
          status: string
          stipend_max: number | null
          stipend_min: number | null
          title: string
          type: string
          updated_at: string
          work_mode: string
        }
        Insert: {
          application_deadline?: string | null
          business_id: string
          created_at?: string
          currency?: string
          description: string
          duration?: string | null
          id?: string
          is_paid?: boolean
          location?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          skills_required?: string[]
          status?: string
          stipend_max?: number | null
          stipend_min?: number | null
          title: string
          type: string
          updated_at?: string
          work_mode?: string
        }
        Update: {
          application_deadline?: string | null
          business_id?: string
          created_at?: string
          currency?: string
          description?: string
          duration?: string | null
          id?: string
          is_paid?: boolean
          location?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          skills_required?: string[]
          status?: string
          stipend_max?: number | null
          stipend_min?: number | null
          title?: string
          type?: string
          updated_at?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          applicant_id: string
          applied_at: string
          business_note: string | null
          cover_letter: string | null
          id: string
          opportunity_id: string
          rejection_reason: string | null
          resume_file_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          business_note?: string | null
          cover_letter?: string | null
          id?: string
          opportunity_id: string
          rejection_reason?: string | null
          resume_file_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          business_note?: string | null
          cover_letter?: string | null
          id?: string
          opportunity_id?: string
          rejection_reason?: string | null
          resume_file_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_resume_file_id_fkey"
            columns: ["resume_file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_consents: {
        Row: {
          allows_financials: boolean | null
          consent_version: string
          created_at: string | null
          id: string
          ip_address: string | null
          parent_email: string
          user_agent: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          allows_financials?: boolean | null
          consent_version: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          parent_email: string
          user_agent?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          allows_financials?: boolean | null
          consent_version?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          parent_email?: string
          user_agent?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      parent_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          otp_code: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          order_id: string
          raw_data: Json | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          order_id: string
          raw_data?: Json | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          order_id?: string
          raw_data?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      phone_otp_verifications: {
        Row: {
          access_token_hash: string | null
          consumed_at: string | null
          consumed_by: string | null
          created_at: string
          expires_at: string
          msg91_identifier: string
          phone: string
          provider_payload: Json
          req_id: string | null
          updated_at: string
          verified_at: string
        }
        Insert: {
          access_token_hash?: string | null
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          expires_at: string
          msg91_identifier: string
          phone: string
          provider_payload?: Json
          req_id?: string | null
          updated_at?: string
          verified_at?: string
        }
        Update: {
          access_token_hash?: string | null
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          expires_at?: string
          msg91_identifier?: string
          phone?: string
          provider_payload?: Json
          req_id?: string | null
          updated_at?: string
          verified_at?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          project_link: string | null
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          project_link?: string | null
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          project_link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_verified: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          age_verified?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          age_verified?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          fcm_token: string
          id: number
          last_seen_at: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          fcm_token: string
          id?: number
          last_seen_at?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          fcm_token?: string
          id?: number
          last_seen_at?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          status: string | null
          target_id: string
          target_type: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string | null
          target_id: string
          target_type?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string | null
          target_id?: string
          target_type?: string | null
        }
        Relationships: []
      }
      resume_experiences: {
        Row: {
          company: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_locked: boolean | null
          is_verified: boolean | null
          platform_application_id: number | null
          proof_domain: string | null
          proof_http_status: number | null
          proof_metadata: Json | null
          proof_status: string | null
          proof_url: string | null
          risk_level: string | null
          source: string | null
          start_date: string | null
          title: string
          user_id: string | null
          verification_id: string | null
          verification_type: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_locked?: boolean | null
          is_verified?: boolean | null
          platform_application_id?: number | null
          proof_domain?: string | null
          proof_http_status?: number | null
          proof_metadata?: Json | null
          proof_status?: string | null
          proof_url?: string | null
          risk_level?: string | null
          source?: string | null
          start_date?: string | null
          title: string
          user_id?: string | null
          verification_id?: string | null
          verification_type?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_locked?: boolean | null
          is_verified?: boolean | null
          platform_application_id?: number | null
          proof_domain?: string | null
          proof_http_status?: number | null
          proof_metadata?: Json | null
          proof_status?: string | null
          proof_url?: string | null
          risk_level?: string | null
          source?: string | null
          start_date?: string | null
          title?: string
          user_id?: string | null
          verification_id?: string | null
          verification_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resume_experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          platform_application_id: number | null
          project_link: string | null
          proof_domain: string | null
          proof_metadata: Json | null
          proof_status: string | null
          risk_level: string | null
          source: string | null
          title: string
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          platform_application_id?: number | null
          project_link?: string | null
          proof_domain?: string | null
          proof_metadata?: Json | null
          proof_status?: string | null
          risk_level?: string | null
          source?: string | null
          title: string
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          platform_application_id?: number | null
          project_link?: string | null
          proof_domain?: string | null
          proof_metadata?: Json | null
          proof_status?: string | null
          risk_level?: string | null
          source?: string | null
          title?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resume_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_skills: {
        Row: {
          created_at: string | null
          id: string
          is_verified: boolean | null
          level: string | null
          project_id: string | null
          proof_metadata: Json | null
          proof_status: string | null
          skill_name: string
          skill_score_id: string | null
          source: string | null
          user_id: string | null
          verification_id: string | null
          verification_source: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          level?: string | null
          project_id?: string | null
          proof_metadata?: Json | null
          proof_status?: string | null
          skill_name: string
          skill_score_id?: string | null
          source?: string | null
          user_id?: string | null
          verification_id?: string | null
          verification_source?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          level?: string | null
          project_id?: string | null
          proof_metadata?: Json | null
          proof_status?: string | null
          skill_name?: string
          skill_score_id?: string | null
          source?: string | null
          user_id?: string | null
          verification_id?: string | null
          verification_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resume_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_verifications: {
        Row: {
          created_at: string | null
          evidence_domain: string | null
          evidence_metadata: Json | null
          evidence_url: string | null
          id: string
          method: string | null
          proof_url: string | null
          reference_id: string | null
          rejection_reason: string | null
          reviewer_id: string | null
          section: string | null
          source: string | null
          status: string | null
          target_id: string | null
          target_type: string | null
          updated_at: string | null
          user_id: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          evidence_domain?: string | null
          evidence_metadata?: Json | null
          evidence_url?: string | null
          id?: string
          method?: string | null
          proof_url?: string | null
          reference_id?: string | null
          rejection_reason?: string | null
          reviewer_id?: string | null
          section?: string | null
          source?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          evidence_domain?: string | null
          evidence_metadata?: Json | null
          evidence_url?: string | null
          id?: string
          method?: string | null
          proof_url?: string | null
          reference_id?: string | null
          rejection_reason?: string | null
          reviewer_id?: string | null
          section?: string | null
          source?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string | null
          deleted_at: string | null
          delivery_time: string | null
          description: string
          freelancer_id: string
          freelancer_name: string
          id: string
          is_archived: boolean | null
          price: number
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          deleted_at?: string | null
          delivery_time?: string | null
          description: string
          freelancer_id: string
          freelancer_name: string
          id?: string
          is_archived?: boolean | null
          price: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          deleted_at?: string | null
          delivery_time?: string | null
          description?: string
          freelancer_id?: string
          freelancer_name?: string
          id?: string
          is_archived?: boolean | null
          price?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "services_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string | null
          id: string
          is_admin: boolean | null
          message: string
          sender_id: string | null
          ticket_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          message: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          message?: string
          sender_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string | null
          id: string
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      uploaded_files: {
        Row: {
          created_at: string
          id: string
          mime_type: string
          original_file_name: string
          owner_id: string
          r2_bucket: string
          r2_object_key: string
          related_id: string | null
          related_type: string
          size_bytes: number
          status: string
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type: string
          original_file_name: string
          owner_id: string
          r2_bucket: string
          r2_object_key: string
          related_id?: string | null
          related_type: string
          size_bytes: number
          status?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string
          original_file_name?: string
          owner_id?: string
          r2_bucket?: string
          r2_object_key?: string
          related_id?: string | null
          related_type?: string
          size_bytes?: number
          status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_files_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_name: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          badge_name?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          badge_name?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_name_fkey"
            columns: ["badge_name"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["name"]
          },
        ]
      }
      user_banking: {
        Row: {
          account_holder_name: string
          account_number: string
          account_number_hash: string | null
          account_number_last4: string | null
          bank_name: string
          beneficiary_id: string | null
          created_at: string | null
          guardian_name: string | null
          guardian_relationship: string | null
          id: string
          ifsc_code: string
          is_guardian_account: boolean | null
          parent_consent_verified: boolean | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          account_number_hash?: string | null
          account_number_last4?: string | null
          bank_name: string
          beneficiary_id?: string | null
          created_at?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          id?: string
          ifsc_code: string
          is_guardian_account?: boolean | null
          parent_consent_verified?: boolean | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          account_number_hash?: string | null
          account_number_last4?: string | null
          bank_name?: string
          beneficiary_id?: string | null
          created_at?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          id?: string
          ifsc_code?: string
          is_guardian_account?: boolean | null
          parent_consent_verified?: boolean | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      user_skill_scores: {
        Row: {
          attempted_at: string | null
          id: string
          score: number | null
          skill: string | null
          user_id: string | null
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          score?: number | null
          skill?: string | null
          user_id?: string | null
        }
        Update: {
          attempted_at?: string | null
          id?: string
          score?: number | null
          skill?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          terms_accepted_at: string | null
          terms_user_agent: string | null
          terms_version: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          terms_accepted_at?: string | null
          terms_user_agent?: string | null
          terms_version?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          terms_accepted_at?: string | null
          terms_user_agent?: string | null
          terms_version?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wallet_accounts: {
        Row: {
          created_at: string
          updated_at: string
          user_id: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          updated_at?: string
          user_id: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          updated_at?: string
          user_id?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          coins: number | null
          created_at: string | null
          description: string
          id: string
          note: string | null
          original_transaction_id: string | null
          reference_app_id: number | null
          reference_id: string | null
          status: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          coins?: number | null
          created_at?: string | null
          description: string
          id?: string
          note?: string | null
          original_transaction_id?: string | null
          reference_app_id?: number | null
          reference_id?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          coins?: number | null
          created_at?: string | null
          description?: string
          id?: string
          note?: string | null
          original_transaction_id?: string | null
          reference_app_id?: number | null
          reference_id?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_app_id_fkey"
            columns: ["reference_app_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_app_id_fkey"
            columns: ["reference_app_id"]
            isOneToOne: false
            referencedRelation: "platform_verified_resume_work"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "wallet_transactions_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_resume_view: {
        Row: {
          bio: string | null
          completion_rate: number | null
          name: string | null
          rating: number | null
          response_speed_hours: number | null
          risk_level: string | null
          specialty: string | null
          tag_line: string | null
          trust_score: number | null
          trust_score_breakdown: Json | null
          user_id: string | null
          verified_experiences: Json | null
          verified_platform_work: Json | null
          verified_projects: Json | null
          verified_skills: Json | null
        }
        Relationships: []
      }
      platform_verified_resume_work: {
        Row: {
          application_id: number | null
          bid_amount: number | null
          completed_at: string | null
          created_at: string | null
          paid_at: string | null
          started_at: string | null
          status: string | null
          submitted_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_freelancer_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_resume_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_freelancer_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_freelancer_bid: {
        Args: {
          p_bid_amount: number
          p_client_id: string
          p_freelancer_id: string
          p_job_id: string
        }
        Returns: Json
      }
      add_experience: {
        Args: {
          p_company: string
          p_desc: string
          p_end: string
          p_proof: string
          p_start: string
          p_title: string
          p_user: string
        }
        Returns: undefined
      }
      add_skill: {
        Args: { p_skill: string; p_source: string; p_user: string }
        Returns: undefined
      }
      apply_for_job_with_energy: {
        Args: {
          p_bid_amount: number
          p_client_id: string
          p_cover_letter: string
          p_energy_cost: number
          p_freelancer_id: string
          p_freelancer_name: string
          p_is_educational_waiver_signed: boolean
          p_job_id: number
        }
        Returns: Json
      }
      apply_referral_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      apply_reputation_risk: { Args: { p_user: string }; Returns: string }
      calculate_trust_score: { Args: { p_user: string }; Returns: number }
      check_referral_code: { Args: { code: string }; Returns: Json }
      claim_daily_reward: {
        Args: { p_today: string; p_user_id: string }
        Returns: Json
      }
      claim_energy_reward: {
        Args: { p_context?: string; p_reward_type: string; p_user_id: string }
        Returns: Json
      }
      claim_referral_reward: { Args: { p_user_id: string }; Returns: Json }
      decrement_resume_limit: { Args: { p_user_id: string }; Returns: Json }
      fund_application_escrow: {
        Args: {
          p_app_id: number
          p_client_id: string
          p_gateway_amount?: number
          p_order_id?: string
          p_wallet_amount?: number
        }
        Returns: Json
      }
      get_auth_bootstrap: { Args: never; Returns: Json }
      grant_subscription_access: {
        Args: {
          p_duration_months: number
          p_order_id?: string
          p_paid_amount?: number
          p_plan_name: string
          p_user_id: string
          p_wallet_amount?: number
        }
        Returns: Json
      }
      hubble_wallet_debit: {
        Args: {
          p_coins: number
          p_conversion_rate: number
          p_note?: string
          p_reference_id: string
          p_user_id: string
        }
        Returns: Json
      }
      hubble_wallet_get_balance: {
        Args: { p_conversion_rate?: number; p_user_id: string }
        Returns: Json
      }
      hubble_wallet_reverse: {
        Args: {
          p_conversion_rate: number
          p_note?: string
          p_reference_id: string
          p_user_id: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_freelancer_kyc_application_bypass_enabled: {
        Args: never
        Returns: boolean
      }
      mark_bank_linked: { Args: { target_user_id: string }; Returns: undefined }
      normalize_freelancer_subscription: {
        Args: { p_user_id: string }
        Returns: Json
      }
      normalize_indian_phone: { Args: { p_phone: string }; Returns: string }
      process_referral_reward: {
        Args: { p_new_user_id: string; p_referral_code: string }
        Returns: Json
      }
      recalculate_all_trust_scores: { Args: never; Returns: undefined }
      search_jobs: {
        Args: { search_term: string }
        Returns: {
          attachments: string[] | null
          budget: number
          category: string | null
          client_id: string
          client_name: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          duration: string | null
          hired_freelancer_id: string | null
          id: number
          is_archived: boolean | null
          is_elite: boolean | null
          job_type: string | null
          tags: string | null
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sync_platform_experience: { Args: { p_user: string }; Returns: undefined }
      tvh_is_admin: { Args: { check_user_id: string }; Returns: boolean }
      verify_parent_otp: {
        Args: { p_code: string; p_email: string }
        Returns: boolean
      }
    }
    Enums: {
      kyc_status_enum: "pending" | "approved" | "rejected" | "not_submitted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      kyc_status_enum: ["pending", "approved", "rejected", "not_submitted"],
    },
  },
} as const

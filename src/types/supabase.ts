export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: {
          id: string
          url: string
          name: string
          type: string
          language: string
          region: string
          quality_score: number
          is_active: boolean
          last_crawled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          name: string
          type?: string
          language?: string
          region?: string
          quality_score?: number
          is_active?: boolean
          last_crawled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          name?: string
          type?: string
          language?: string
          region?: string
          quality_score?: number
          is_active?: boolean
          last_crawled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      raw_opportunities: {
        Row: {
          id: string
          source_id: string
          external_id: string | null
          title: string
          description: string
          url: string
          deadline: string | null
          country: string | null
          category: string | null
          organization: string | null
          eligibility: string | null
          raw_html: string | null
          fetched_at: string
          hash: string
          created_at: string
        }
        Insert: {
          id?: string
          source_id: string
          external_id?: string | null
          title: string
          description: string
          url: string
          deadline?: string | null
          country?: string | null
          category?: string | null
          organization?: string | null
          eligibility?: string | null
          raw_html?: string | null
          fetched_at?: string
          hash: string
          created_at?: string
        }
        Update: {
          id?: string
          source_id?: string
          external_id?: string | null
          title?: string
          description?: string
          url?: string
          deadline?: string | null
          country?: string | null
          category?: string | null
          organization?: string | null
          eligibility?: string | null
          raw_html?: string | null
          fetched_at?: string
          hash?: string
          created_at?: string
        }
      }
      opportunities: {
        Row: {
          id: string
          source_id: string | null
          title: string
          summary: string | null
          description: string
          url: string
          deadline: string | null
          country: string | null
          category: string
          organization: string | null
          eligibility: string | null
          benefits: string | null
          required_documents: string[] | null
          application_link: string | null
          deadline_urgency: number | null
          difficulty_score: number | null
          quality_score: number | null
          match_score: number | null
          tags: string[] | null
          status: string
          is_featured: boolean
          view_count: number
          application_count: number
          title_sw: string | null
          summary_sw: string | null
          description_sw: string | null
          social_copy: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source_id?: string | null
          title: string
          summary?: string | null
          description: string
          url: string
          deadline?: string | null
          country?: string | null
          category: string
          organization?: string | null
          eligibility?: string | null
          benefits?: string | null
          required_documents?: string[] | null
          application_link?: string | null
          deadline_urgency?: number | null
          difficulty_score?: number | null
          quality_score?: number | null
          match_score?: number | null
          tags?: string[] | null
          status?: string
          is_featured?: boolean
          view_count?: number
          application_count?: number
          title_sw?: string | null
          summary_sw?: string | null
          description_sw?: string | null
          social_copy?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source_id?: string | null
          title?: string
          summary?: string | null
          description?: string
          url?: string
          deadline?: string | null
          country?: string | null
          category?: string
          organization?: string | null
          eligibility?: string | null
          benefits?: string | null
          required_documents?: string[] | null
          application_link?: string | null
          deadline_urgency?: number | null
          difficulty_score?: number | null
          quality_score?: number | null
          match_score?: number | null
          tags?: string[] | null
          status?: string
          is_featured?: boolean
          view_count?: number
          application_count?: number
          title_sw?: string | null
          summary_sw?: string | null
          description_sw?: string | null
          social_copy?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          education_level: string | null
          profession: string | null
          country: string | null
          interests: string[] | null
          industry: string | null
          skills: string[] | null
          phone: string | null
          whatsapp_subscribed: boolean
          email_subscribed: boolean
          push_subscribed: boolean
          is_onboarded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          education_level?: string | null
          profession?: string | null
          country?: string | null
          interests?: string[] | null
          industry?: string | null
          skills?: string[] | null
          phone?: string | null
          whatsapp_subscribed?: boolean
          email_subscribed?: boolean
          push_subscribed?: boolean
          is_onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          education_level?: string | null
          profession?: string | null
          country?: string | null
          interests?: string[] | null
          industry?: string | null
          skills?: string[] | null
          phone?: string | null
          whatsapp_subscribed?: boolean
          email_subscribed?: boolean
          push_subscribed?: boolean
          is_onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_matches: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string
          match_score: number
          match_reasons: string[] | null
          is_viewed: boolean
          is_saved: boolean
          is_applied: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          opportunity_id: string
          match_score: number
          match_reasons?: string[] | null
          is_viewed?: boolean
          is_saved?: boolean
          is_applied?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          opportunity_id?: string
          match_score?: number
          match_reasons?: string[] | null
          is_viewed?: boolean
          is_saved?: boolean
          is_applied?: boolean
          created_at?: string
        }
      }
      agent_tasks: {
        Row: {
          id: string
          agent_name: string
          action: string
          payload: Json
          status: string
          result: Json | null
          error: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_name: string
          action: string
          payload?: Json
          status?: string
          result?: Json | null
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_name?: string
          action?: string
          payload?: Json
          status?: string
          result?: Json | null
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      ai_cache: {
        Row: {
          id: string
          prompt_hash: string
          response: Json
          model: string
          tokens_used: number
          created_at: string
        }
        Insert: {
          id?: string
          prompt_hash: string
          response: Json
          model?: string
          tokens_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          prompt_hash?: string
          response?: Json
          model?: string
          tokens_used?: number
          created_at?: string
        }
      }
      seo_content: {
        Row: {
          id: string
          slug: string
          title: string
          meta_description: string
          h1: string
          content: string
          category: string | null
          country: string | null
          tags: string[] | null
          canonical_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          meta_description: string
          h1: string
          content: string
          category?: string | null
          country?: string | null
          tags?: string[] | null
          canonical_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          meta_description?: string
          h1?: string
          content?: string
          category?: string | null
          country?: string | null
          tags?: string[] | null
          canonical_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      revenue_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          amount: number
          currency: string
          stripe_event_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          amount: number
          currency?: string
          stripe_event_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          amount?: number
          currency?: string
          stripe_event_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          channel: string
          is_read: boolean
          sent_at: string
          read_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          channel: string
          is_read?: boolean
          sent_at?: string
          read_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          channel?: string
          is_read?: boolean
          sent_at?: string
          read_at?: string | null
          metadata?: Json | null
        }
      }
      trending_topics: {
        Row: {
          id: string
          topic: string
          category: string | null
          country: string | null
          score: number
          period: string
          generated_at: string
        }
        Insert: {
          id?: string
          topic: string
          category?: string | null
          country?: string | null
          score?: number
          period?: string
          generated_at?: string
        }
        Update: {
          id?: string
          topic?: string
          category?: string | null
          country?: string | null
          score?: number
          period?: string
          generated_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string
          author: string
          cover_image: string | null
          tags: string[] | null
          is_published: boolean
          is_generated: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content: string
          author?: string
          cover_image?: string | null
          tags?: string[] | null
          is_published?: boolean
          is_generated?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string
          author?: string
          cover_image?: string | null
          tags?: string[] | null
          is_published?: boolean
          is_generated?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

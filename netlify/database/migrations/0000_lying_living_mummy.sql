CREATE TABLE "model_benchmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"dataset_name" text NOT NULL,
	"language" text NOT NULL,
	"accuracy" text NOT NULL,
	"precision" text NOT NULL,
	"recall" text NOT NULL,
	"f1_score" text NOT NULL,
	"auc_roc" text NOT NULL,
	"sample_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_uid" text,
	"filename" text NOT NULL,
	"audio_format" text NOT NULL,
	"file_size_bytes" integer,
	"duration_seconds" text,
	"sample_rate" integer,
	"detected_language" text NOT NULL,
	"language_confidence" text,
	"classification" text NOT NULL,
	"confidence_score" text NOT NULL,
	"ai_probability" text NOT NULL,
	"human_probability" text NOT NULL,
	"acoustic_features" text,
	"model_explanation" text,
	"source" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);

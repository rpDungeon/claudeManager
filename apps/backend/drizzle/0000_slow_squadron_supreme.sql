CREATE TABLE `claude_sessions` (
	`created_at` integer NOT NULL,
	`description` text,
	`external_session_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`last_active_at` integer NOT NULL,
	`name` text,
	`project_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `claude_sessions_external_session_id_unique` ON `claude_sessions` (`external_session_id`);--> statement-breakpoint
CREATE TABLE `layouts` (
	`created_at` integer NOT NULL,
	`desktop` text,
	`id` text PRIMARY KEY NOT NULL,
	`mobile` text,
	`name` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`layout_id` text,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`layout_id`) REFERENCES `layouts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `terminals` (
	`claude_session_id` text,
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`layout_config` text,
	`name` text NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`claude_session_id`) REFERENCES `claude_sessions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);

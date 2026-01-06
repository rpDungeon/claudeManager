CREATE TABLE `terminal_input_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`input` text NOT NULL,
	`terminal_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`terminal_id`) REFERENCES `terminals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `layouts` ADD `project_id` text NOT NULL;
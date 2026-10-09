CREATE TABLE `quota` (
	`id` text PRIMARY KEY NOT NULL,
	`day` integer NOT NULL,
	`count` integer NOT NULL,
	`next` integer NOT NULL
);

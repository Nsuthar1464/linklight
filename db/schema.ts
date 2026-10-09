import {integer,sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const quota=sqliteTable('quota',{id:text('id').primaryKey(),day:integer('day').notNull(),count:integer('count').notNull(),next:integer('next').notNull()});

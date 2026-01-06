-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "preferred_name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "profile_picture" TEXT,
    "birth_date" DATETIME NOT NULL,
    "course" TEXT NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "address_complement" TEXT,
    "company" TEXT,
    "role" TEXT,
    "phone" TEXT NOT NULL,
    "linkedin_username" TEXT,
    "bio" TEXT,
    "skills" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "alumni_email_key" ON "alumni"("email");

-- CreateTable
CREATE TABLE "FplTeamCache" (
    "id" TEXT NOT NULL,
    "fplTeamId" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "playerName" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FplTeamCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FplTeamCache_fplTeamId_key" ON "FplTeamCache"("fplTeamId");

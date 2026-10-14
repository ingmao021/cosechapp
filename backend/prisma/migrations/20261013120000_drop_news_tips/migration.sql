-- Los tips mensuales se eliminaron de la app: se borran sus filas, la columna "month"
-- y el valor TIP del enum (Postgres no quita valores de un enum, por eso se recrea).
DELETE FROM "news_articles" WHERE "kind" = 'TIP';

-- DropIndex
DROP INDEX "news_articles_kind_month_idx";

-- AlterTable
ALTER TABLE "news_articles" DROP COLUMN "month";

-- AlterEnum
ALTER TYPE "NewsKind" RENAME TO "NewsKind_old";
CREATE TYPE "NewsKind" AS ENUM ('NEWS');
ALTER TABLE "news_articles" ALTER COLUMN "kind" TYPE "NewsKind" USING ("kind"::text::"NewsKind");
DROP TYPE "NewsKind_old";

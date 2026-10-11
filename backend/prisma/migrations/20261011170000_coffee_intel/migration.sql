-- CreateEnum
CREATE TYPE "NewsKind" AS ENUM ('NEWS', 'TIP');

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "kind" "NewsKind" NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "month" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_insights" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "coffee_price_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "news_articles_kind_published_at_idx" ON "news_articles"("kind", "published_at");

-- CreateIndex
CREATE INDEX "news_articles_kind_month_idx" ON "news_articles"("kind", "month");

-- CreateIndex
CREATE INDEX "news_articles_url_idx" ON "news_articles"("url");

-- CreateIndex
CREATE INDEX "price_insights_created_at_idx" ON "price_insights"("created_at");


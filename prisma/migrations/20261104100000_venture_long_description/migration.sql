-- Long-form product copy for the product page ("about / what to expect / what
-- you get / what we expect from you"). The short description stays as-is for
-- cards and meta tags.

ALTER TABLE "Venture" ADD COLUMN "longDescription" TEXT;

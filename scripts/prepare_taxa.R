library(dplyr)

source("scripts/utils.R")

taxa <- timedFread("tabular_data/reintegrated-obs-assigned-taxa.csv") # x
oldTaxa <- timedFread("tabular_data/reintegrated.csv") # y - includes original common names, hulq data, taxonName

names(oldTaxa)[names(oldTaxa) == "Taxon name"] <- "taxonName"

mergedTaxa <- merge(x = taxa, y = oldTaxa, by.x = "id", by.y = "iNaturalist taxon ID", all.x = TRUE)

commonName <- dplyr::coalesce(mergedTaxa$commonName.y, mergedTaxa$commonName.x)

finalTaxa <- mergedTaxa[, names(mergedTaxa) %in% c("id", "parentId", "iNaturalistTaxonName", "rank", "iNaturalistTaxonImage", "taxonName",
                                                   "foodValue", "medicinalValue", "spiritualValue", "materialValue",
                                                   "tradeValue", "indicatorValue", "hulquminumName", "hulquminumAuthority","audioLink")]

finalTaxa$commonName = commonName;

timedWrite(finalTaxa, "tabular_data/reintegrated-final-taxa.csv")

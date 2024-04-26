library(dplyr)

source("scripts/utils.R")

obs <- timedFread("tabular_data/reintegrated-obs.csv")

filtered <- obs[, names(obs) %in% c("iNaturalist taxon name", "iNaturalist taxon ID", "Taxon name", "Phylum", "observationId", "Latitude", "Longitude", "Date observed", "Recorded by", "COMMUNITY")]

names(filtered)[names(filtered) == "COMMUNITY"] <- "Community"

filtered$Community[filtered$Community == "Woodlands and rock outcrops"] <- "Woodlands"

timedWrite(filtered, "tabular_data/reintegrated-obs-filtered.csv")


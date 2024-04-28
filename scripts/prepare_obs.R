library(dplyr)
library(stringr)

source("scripts/utils.R")

obs <- timedFread("tabular_data/reintegrated-obs.csv")
marine_animals <- timedFread("tabular_data/marine-animals-reintegrated.csv");

for (i in 1:nrow(obs)) {
  row <- obs[i, ]
  taxon <- row$`iNaturalist taxon name`
  if (any(marine_animals$`iNaturalist taxon name` == taxon) & row$COMMUNITY != "Marine") {
    print(str_glue("Correcting community for observation of {taxon} at row {i} from {row$COMMUNITY} to Marine since present in Marine Animalia dataset"))
    obs[i, "COMMUNITY"] <- "Marine"
  }
  toForest <- function (rank, value) {
    print(str_glue("Correcting community for observation of {taxon} at row {i} from {row$COMMUNITY} to Forest since {rank} is {value}"))
    obs[i, "COMMUNITY"] <<- "Forest"
  }
  if (row$COMMUNITY == "Marine") {
    if (row$Phylum == "Tracheophyta" & row$Genus != "Zostera") {
      toForest("Phylum", "Tracheophyta")
    } else if (row$Phylum == "Bryophyta") {
       toForest("Phylum", "Bryophyta")
    } else if (row$Kingdom == "Fungi") {
       toForest("Kingdom", "Fungi")
    }
  }
}

filtered <- obs[, names(obs) %in% c("iNaturalist taxon name", "iNaturalist taxon ID", "Taxon name", "Phylum", "observationId", "Latitude", "Longitude", "Date observed", "Recorded by", "COMMUNITY")]

names(filtered)[names(filtered) == "COMMUNITY"] <- "Community"

filtered$Community[filtered$Community == "Woodlands and rock outcrops"] <- "Woodlands"

timedWrite(filtered, "tabular_data/reintegrated-obs-filtered.csv")


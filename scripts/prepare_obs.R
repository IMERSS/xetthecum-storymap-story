library(dplyr)
library(stringr)

source("scripts/utils.R")

ranks <- c("Kingdom", "Phylum", "Subphylum", "Superclass", "Class", "Subclass",
  "Superorder", "Order", "Suborder", "Infraorder", "Superfamily", "Family",
  "Subfamily", "Tribe", "Genus", "Species")

get_highest_rank <- function (row) {
  max_rank <- NA
  for (rank in ranks) {
    if (!is.na(row[rank])) {
      max_rank <- rank
    }
  }
  return (tolower(max_rank))
}

obs <- timedFread("tabular_data/reintegrated-obs.csv")
marine_animals <- timedFread("tabular_data/marine-animals-reintegrated.csv");

# From Signal message from AS 30/4/24 - these will not have community adjusted away from Marine
marine_tracheophytes = c("Cakile maritima", "Rumex salicifolius", "Lathyrus latifolius", "Atriplex patula", "Lathyrus japonicus")

for (i in 1:nrow(obs)) {
  row <- obs[i, ]
  taxon <- row$`iNaturalist taxon name`
  if (any(marine_animals$`iNaturalist taxon name` == taxon) & row$COMMUNITY != "Marine") {
    print(str_glue("Correcting community for observation of {taxon} at row {i} from {row$COMMUNITY} to Marine since present in Marine Animalia dataset"))
    obs[i, "COMMUNITY"] <- "Marine"
  }
  toForests <- function (rank, value) {
    print(str_glue("Correcting community for observation of {taxon} at row {i} from {row$COMMUNITY} to Forests since {rank} is {value}"))
    obs[i, "COMMUNITY"] <<- "Forests"
  }
  if (row$COMMUNITY == "Marine") {
    if (row$Phylum == "Tracheophyta" & row$Genus != "Zostera" & !taxon %in% marine_tracheophytes) {
       toForests("Phylum", "Tracheophyta")
    } else if (row$Phylum == "Bryophyta") {
       toForests("Phylum", "Bryophyta")
    } else if (row$Kingdom == "Fungi") {
       toForests("Kingdom", "Fungi")
    }
  }
}

names(obs)[names(obs) == "COMMUNITY"] <- "Community"

obs$Community[obs$Community == "Woodlands and rock outcrops"] <- "Woodlands"

# Remove some columns added during JS preparation workflow
obs <- obs[, !names(obs) %in% c("ambiguousNameMatch", "clazz")]

# Remove any empty columns - https://stackoverflow.com/a/17672764
emptyCols <- colSums(is.na(obs)) == nrow(obs)
obs <- obs[!emptyCols]

# Assign rank field required by assignNames - can be stripped out after prepare_taxa
obs$Rank <- apply(obs, 1, get_highest_rank)

timedWrite(obs, "tabular_data/Xetthecum-observations.csv")

# Write out obs files filtered by community to be provided as downloads
communities <- unique(obs$Community)
for (community in communities) {
  communityObs <- obs %>% filter(Community == community)
  timedWrite(communityObs, str_glue("tabular_data/Xetthecum-community-{community}-observations.csv"))
}

# Filter out fields which are not required for viz

filtered <- obs[, names(obs) %in% c("iNaturalist taxon name", "iNaturalist taxon ID", "Taxon name", "Phylum", "Rank", "observationId", "Latitude", "Longitude", "Date observed", "Recorded by", "Community")]

timedWrite(filtered, "tabular_data/reintegrated-obs-filtered.csv")

# Map vascular plant diversity in Átl’ka7tsem by BEC unit

# Load libraries

library(dplyr)
library(leaflet)
library(raster)
library(reshape2)
library(scales)
library(sf)
library(rjson)
library(viridis)

# Source dependencies

source("scripts/utils.R")

# Intersect vascular plant data and BEC zones for viz

# Note: this script calls 'plants.gridded.csv' — 
# bypassing a direct intersection of plant data and BEC units for now! (this may not be desirable)

# First read vascular plant data

plants.gridded <- read.csv("tabular_data/1km_gridded_vascular_plant_records_2022-12-24_WGS84.csv")
metadata <- read.csv("tabular_data/1km_grid_metadata.csv")

# Assign BEC map labels to gridded plant data

plants.gridded$MAP_LABEL <- metadata$MAP_LABEL[match(unlist(plants.gridded$id), metadata$id)]
  
# Summarize plant species by BEC unit

bec.plants <- plants.gridded %>% group_by(MAP_LABEL) %>% 
                    summarize(taxa = paste(sort(unique(scientific)),collapse=", "))

# Write summarised plants to JSON file for viz

write(rjson::toJSON(bec.plants), "viz_data/Vascular-regionTaxa.json")

# Load BEC Zones shape

BEC <- mx_read("spatial_data/vectors/BEC")

# TODO: This is not greatly helpful since it explodes the 9 basic selections for the BEC zones into the 71 for each polygon.
BEC$TAXA <- bec.plants$taxa[match(unlist(BEC$MAP_LABEL), bec.plants$MAP_LABEL)]

# Simplify BEC shape

# First create comprehensive description field

BEC$DESC <- paste(BEC$VRNTNM, BEC$SBZNNM, BEC$ZONE_NAME, "Zone", sep = " ")

# Remove unnecessary variables

BEC$ZONE <- NULL
BEC$VRNTNM <- NULL
BEC$SBZNNM <-  NULL
BEC$PHASE <-  NULL
BEC$OBJECTID <-  NULL
BEC$NTRLDSTRB1 <-  NULL
BEC$NTRLDSTRBN <-  NULL
BEC$FTRLNGTH <-  NULL
BEC$FTRR <-  NULL
BEC$BGC_LABEL <- NULL
BEC$FTRCLSSSK <- NULL
BEC$PHASE_NAME <- NULL
BEC$VARIANT <- NULL
BEC$ZONE_NAME <- NULL
BEC$SUBZONE <- NULL

# Create color palette for BEC Zones

# Following rough elevational gradient:  
# CDFmm, CWHxm1, CWHdm, CWHvm1, CWHvm2, CWHds1, CWHms1, MHmm1, MHmm2, ESSFmw2, CMAunp

# Note: I do not think that the palette is mapping with the MAP_LABEL feature as intended!

BEC$MAP_LABEL <- as.factor(BEC$MAP_LABEL)

unique(BEC$MAP_LABEL)

palette = data.frame(
            cat = c("CWHxm1","CWHdm","CWHvm2","CWHvm1","CWHds1","CWHms1","MHmm1","MHmm2","CMAunp"), 
# Reverse   cat = c("CMAunp", "MHmm2", "MHmm1", "CWHms1","CWHds1","CWHvm1","CWHvm2","CWHdm","CWHxm1"),
            col = c("#440154FF", "#472D7BFF","#3B528BFF","#2C728EFF","#21908CFF","#27AD81FF","#5DC863FF","#AADC32FF", "#FDE725FF")
)

BEC <- base::merge(BEC, palette, by.x ="MAP_LABEL", by.y="cat")

# Load additional map layers

# Layer 1: hillshade raster
hillshade <- raster("spatial_data/rasters/Hillshade_80m.tif")

# Layer 2: coastline
coastline <- mx_read("spatial_data/vectors/Islands_and_Mainland")

# Layer 3: watershed boundary
watershed.boundary <- mx_read("spatial_data/vectors/Howe_Sound")

# Attach the region's label as an "mx_regionId" option in the output data
labelToOption <- function (label) {
  return (list(mx_regionId = label))
}

# Plot map

speciesMap <- leaflet(options=list(mx_mapId="Vascular")) %>%
  setView(-123.2194, 49.66076, zoom = 8.5) %>%
  addTiles(options = providerTileOptions(opacity = 0.5)) %>%
  addRasterImage(hillshade, opacity = 0.8) %>%
  addPolygons(data = coastline, color = "black", weight = 1.5, fill = FALSE) %>%
  addPolygons(data = BEC, fillColor = BEC$col, fillOpacity = 0.6, weight = 3, stroke = FALSE, options = labelToOption(BEC$MAP_LABEL)) %>%
  addPolygons(data = watershed.boundary, color = "black", weight = 4, fill = FALSE) %>%
    #addLegend(position = 'topright', pal = ~col, groupvalues = BEC$MAP_LABEL)

#Note that this statement is only effective in standalone R
print(speciesMap)

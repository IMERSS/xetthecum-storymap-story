# Map Átl’ka7tsem's vascular plant diversity in relation to protected areas

# Load libraries

library(sf)
library(leaflet)
library(dplyr)
library(plotly)
library(raster)
library(reshape2)
library(viridis)

# Source dependencies

source("scripts/utils.R")

# Read occurrence data (plants x protected area)

plants.x.protected.area <- read.csv("tabular_data/plants_x_protected_areas.csv")

# Load Protected Areas Shape

protected.areas <- mx_read("spatial_data/vectors/Protected_Areas")

# Create labels

protected.areas$prtct__[is.na(protected.areas$prtct__)] <- 0

protected.areas$label <- paste(protected.areas$prtctdA, ":", protected.areas$prtct__, "species", sep = " ")

# Load additional map layers

# Layer 1: hillshade raster
hillshade <- raster("spatial_data/rasters/Hillshade_80m.tif")

# Layer 2: coastline
coastline <- mx_read("spatial_data/vectors/Islands_and_Mainland")

# Layer 3: watershed boundary
watershed.boundary <- mx_read("spatial_data/vectors/Howe_Sound")

# Note: for the following map, species can be mapped to protected areas based on the 
# catalog called as 'plants.x.protected.area' 

# Create color palette

palette = data.frame(
  cat = unique(protected.areas$prtctAT),
  colors = c('#8b4513', '#008000', '#4682b4', '#4b0082', '#ff0000', '#00ff00', '#00ffff', '#0000ff', '#ffff54', '#ff69b4', '#ffe4c4')
)

protected.areas <- base::merge(protected.areas, palette, by.x ="prtctAT", by.y="cat")

# Plot map

protectedAreaMap <- leaflet() %>%
  setView(-123.2194, 49.66076, zoom = 8.5) %>%
  addTiles(options = providerTileOptions(opacity = 0.5)) %>%
  addRasterImage(hillshade, opacity = 0.8) %>%
  addPolygons(data = coastline, color = "black", weight = 1.5, fillOpacity = 0, fillColor = NA) %>%
  addPolygons(data = watershed.boundary, color = "black", weight = 4, fillOpacity = 0) %>% 
addPolygons(data = protected.areas, fillColor = protected.areas$colors, fillOpacity = 0.8, weight = 0,
            label = paste(protected.areas$prtctdA, ":", protected.areas$prtct__, "species", sep = " "))

#Note that this statement is only effective in standalone R
print(protectedAreaMap)


# Create dataframe summarizing plant diversity by protected area type

types <- as.factor(unique(protected.areas$prtctAT))
count <- vector(mode="numeric", length=length(types))

protected.area.summary <- data.frame(types,count)

protected.area.summary$count <- protected.areas$prtctd_r__[match(unlist(protected.area.summary$types), protected.areas$prtctAT)]

protected.area.summary <- protected.area.summary[order(protected.area.summary$types),]

protected.area.summary$types <- factor(protected.area.summary$types, levels = unique(protected.area.summary$types)[order(protected.area.summary$count, decreasing = TRUE)])

# Create Plotly bar plot showing species diversity represented within protected area types

protected.area.plot <- plot_ly(
                          data = protected.area.summary,
                          y = ~types,
                          x = ~count,
                          color = ~types,
                          colors = colors,
                          type = "bar"
                            ) %>% layout(xaxis = list(categoryorder = "category ascending"))

protected.area.plot 
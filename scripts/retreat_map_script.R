library(sf)
library(leaflet)
library(dplyr)
library(raster)
library(reshape2)
library(rjson)
library(scales)
library(stringr)

# Source dependencies
source("scripts/utils.R")

# import datasets
polygonStyling <- timedFread("tabular_data/polygonStyling.csv")
lineStyling <- timedFread("tabular_data/lineStyling.csv")
# set highlighting on one or more layers:
highlightedLayers <- c();

# TODO: Add a retreat cove outline shapefile to highlight the area (Optional)

mx_retreat_map <- function () {
  title <- "Xetthecum Introduction";
  
  boundingBox <- mx_read("spatial_data/vectors/RetreatCove") %>% 
    st_bbox() %>% 
    as.character();
  
  
  # Plot map
  sectionMap <- leaflet(options=list(mx_mapId="Retreat")) %>%
    fitBounds(boundingBox[1],boundingBox[2],boundingBox[3],boundingBox[4], options = list(padding = c(-10,-10))) %>%
    addProviderTiles(providers$CartoDB.Positron)
    
    # loop through all the polygon layers and add them to the map
    for (i in 1:nrow(polygonStyling)) {
      row <- polygonStyling[i,]
      
      # if the row isn't highlighted, add it to the map first
      if (!(row$Layer %in% highlightedLayers)) {
        sectionMap <- sectionMap %>% addPolygons(data = mx_read(paste("spatial_data/vectors/",row$Layer, sep="")), 
                                          fillColor = row$fillColor, 
                                          fillOpacity = as.numeric(row$fillOpacity), 
                                          stroke = TRUE,
                                          color = row$outlineColor,
                                          opacity = row$outlineOpacity,
                                          weight = row$outlineWidth,
                                          options = list(mx_layerId = row$Layer, className = row$ClassName))
      };
      
      # then if it should be highlighted, add it to the map. This is to ensure it's on top of the other layers.
      if (row$Layer %in% highlightedLayers) {
        sectionMap <- sectionMap %>% addPolygons(data = mx_read(paste("spatial_data/vectors/",row$Layer, sep="")), 
                                          fillColor = row$fillColor, 
                                          fillOpacity = as.numeric(row$fillOpacity), 
                                          stroke = TRUE,
                                          color = "yellow",
                                          opacity = 1,
                                          weight = (row$outlineWidth+2),
                                          options = list(mx_layerId = row$Layer, className = row$ClassName))
      }
    };
  
    for (i in 1:nrow(lineStyling)) {
      row <- lineStyling[i,]
      
      if (!(row$Layer %in% highlightedLayers)) {
        sectionMap <- sectionMap %>% addPolylines(data = mx_read(paste("spatial_data/vectors/",row$Layer, sep="")), 
                                           stroke = TRUE,
                                           color = row$outlineColor,
                                           opacity = as.numeric(row$outlineOpacity),
                                           weight = as.numeric(row$outlineWidth),
                                           options = list(mx_layerId = row$Layer, className = row$ClassName))
      };
      
      if (row$Layer %in% highlightedLayers) {
        sectionMap <- sectionMap %>% addPolylines(data = mx_read(paste("spatial_data/vectors/",row$Layer, sep="")), 
                                           stroke=TRUE,
                                           color="yellow",
                                           opacity = 1,
                                           weight = as.numeric(row$outlineWidth+2),
                                           options = list(mx_layerId = row$Layer, className = row$ClassName))
      };
      
    };
  
  #Note that this statement is only effective in standalone R
  print(sectionMap) 
  

}

mx_retreat_map()

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
communityStyling <- timedFread("tabular_data/communityStyling.csv")
communityStyling <- communityStyling[order(Z_Order)]

mx_ecological_map <- function () {
  title <- "Xetthecum Ecological Communities";

  boundingBox <- mx_read("spatial_data/vectors/ProjectBoundary") %>% 
    st_bbox() %>% 
    as.character();
  
  
  # Plot map
  sectionMap <- leaflet(options=list(mx_mapId="Ecological")) %>%
    fitBounds(boundingBox[1],boundingBox[2],boundingBox[3],boundingBox[4], options = list(padding = c(-350,-350))) %>%
    addProviderTiles(providers$CartoDB.Positron)
  
  # loop through all the polygon layers and add them to the map
  for (i in 1:nrow(communityStyling)) {
    row <- communityStyling[i,]
    
    sectionMap <- sectionMap %>% addPolygons(data = mx_read(paste("spatial_data/vectors/",row$Layer, sep="")), 
                                             fillColor = row$fillColor, 
                                             fillOpacity = as.numeric(row$fillOpacity), 
                                             stroke = TRUE,
                                             color = row$outlineColor,
                                             opacity = row$outlineOpacity,
                                             weight = row$outlineWidth,
                                             options = list(mx_regionId = ifelse(row$ClassName == "", "", row$Layer), className = row$ClassName))
  };
  
  #Note that this statement is only effective in standalone R
  print(sectionMap) 
  
}

mx_ecological_map()

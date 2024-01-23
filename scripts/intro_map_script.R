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

# intro map should 

#Layer 1: Greig Creek vector
GreigCreek <- mx_read("spatial_data/vectors/GreigCreek")
#Layer 2: Retreat Cove vector
RetreatCove <- mx_read("spatial_data/vectors/RetreatCove")
#Layer 3: Laughlin Lake vector
LaughlinLake <- mx_read("spatial_data/vectors/LaughlinLake")
#Layer 4: Eelgrass
EelgrassSimplified <- mx_read("spatial_data/vectors/EelgrassSimplified")
#Layer 5: Forests
Forests <- mx_read("spatial_data/vectors/Forests")
#Layer 6: Freshwater
Freshwater <- mx_read("spatial_data/vectors/Freshwater")
#Layer 7: Anthropogenic
Anthropogenic <- mx_read("spatial_data/vectors/Anthropogenic")
#Layer 8: MarineLittoral
MarineLittoral <- mx_read("spatial_data/vectors/MarineLittoral")
#Layer 9: WoodlandsRockOutcrops
WoodlandsRockOutcrops <- mx_read("spatial_data/vectors/WoodlandsRockOutcrops")
#Layer 10: ProjectBoundary
ProjectBoundary <- mx_read("spatial_data/vectors/ProjectBoundary")
#Layer 11: Streams
Streams <- mx_read("spatial_data/vectors/Streams")


mx_intro_map <- function () {
  title <- "Xetthecum Introduction";
  
  # Plot map
  introMap <- leaflet(options=list(mx_mapId="Introduction")) %>%
    fitBounds(-123.513, 48.954, -123.491, 48.936) %>%
    addProviderTiles(providers$CartoDB.Positron) %>%
    addPolylines(data = GreigCreek,
                stroke = TRUE,
                smoothFactor = 0.5,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="GreigCreek")) %>%
    addPolygons(data = RetreatCove,
              fillColor = "lightskyblue",
              fillOpacity = 0.7,
              weight = 1,
              options=list(mx_layerId="RetreatCove")) %>%
    addPolygons(data = LaughlinLake,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="LaughlinLake")) %>%
    addPolygons(data = EelgrassSimplified,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="EelgrassSimplified")) %>%
    addPolygons(data = Forests,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="Forests", className="fld-imerss-region-woodland")) %>%
    addPolygons(data = Freshwater,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="Freshwater")) %>%
    addPolygons(data = Anthropogenic,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="Anthropogenic")) %>%
    addPolygons(data = MarineLittoral,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="MarineLittoral")) %>%
    addPolygons(data = WoodlandsRockOutcrops,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="WoodlandsRockOutcrops")) %>%
    addPolygons(data = ProjectBoundary,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="ProjectBoundary")) %>%
    addPolygons(data = Streams,
                fillColor = "lightskyblue",
                fillOpacity = 0.7,
                weight = 1,
                options=list(mx_layerId="Streams"))
 
  
  # Draw the gridded data in a funny way so that richness, cell_id etc. can be tunneled through options one at a time
  # for (i in 1:nrow(choropleth)) {
  #   row <- choropleth[i,]
  #   introMap <- introMap %>% addPolygons(data = row, fillColor = pal(row$richness), fillOpacity = 0.4, weight = 0,
  #                                                popup = paste("Richness:", row$richness), 
  #                                                popupOptions = popupOptions(closeButton = FALSE),
  #                                                options = mx_diversityRowToOptions(row))
  # }
  
  #Note that this statement is only effective in standalone R
  print(introMap) 
  

}

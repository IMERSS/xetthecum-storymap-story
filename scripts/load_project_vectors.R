source("scripts/utils.R")
source("scripts/mapbox_map_common.R")

# Load all vectors used in the project, and convert to geojson and hence to a set of 
# "sources" definitions for use in mapbox. Since the geojson conversion operation is
# currently very expensive we just do this once per knit of the markdown

polygonStyling <- timedFread("tabular_data/polygonStyling.csv");
lineStyling <- timedFread("tabular_data/lineStyling.csv");
classStyling <- rbind(polygonStyling, lineStyling)

communityStyling <- timedFread("tabular_data/communityStyling.csv")

allLayersVector = unique(c(classStyling$Layer, communityStyling$Layer))

# Method attested at https://stackoverflow.com/questions/14620972/how-to-combine-two-vectors-into-a-data-frame
allLayers = data.frame(allLayersVector)
names(allLayers) = c("Layer")

allLayers <- load_and_convert_geojson(allLayers)
allSources <- rowsToSources(allLayers)

project_bbox <- mx_read("spatial_data/vectors/ProjectBoundary") %>% st_bbox()

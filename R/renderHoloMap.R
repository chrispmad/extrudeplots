#' Render a Three.js Holo Map widget
#'
#' @param outputId Unique ID to link render and output functions
#' @param dat Data to use in extrude plot
#' @param height_col Column name that should be used to inform height of holographic pillars
#' @param session Shiny session; should just say session = session
#'
#' @returns One half of a Shiny-compatible render and output combo. You don't need to assign this to Shiny's output list
#' @export
renderHoloMap = function(outputId = NULL, dat, session){
  observe({
    if(is.null(outputId)) stop("outputId must be named for renderHoloMap()")
    if(is.null(session)) stop("session must be 'session = session'")
    if(is.reactive(dat)) dat = dat()
    # If no reactiveVal exists for this outputId to track first data send, create it.
    if(!exists(paste0('first_data_send_',outputId), envir = session$userData)){
      # Create first_data_send reactive and ship it to global env
      session$userData[[paste0('first_data_send_',outputId)]] <- reactiveVal(FALSE)
      print(paste0("Using reactiveVal first_data_send_",outputId))
    }
    # Send data to Holomap.js
    session$sendCustomMessage(paste0("holoMapData_",outputId), list(
      iframeID = outputId,
      data = dat
    ))
  })
}

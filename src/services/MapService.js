/** 
* @class Spectrum Spatial Map Service wrapper
* @augments L.SpectrumSpatial.Services.Service 
* @constructs L.SpectrumSpatial.Services.MapService
* @param {string} url Url of service
* @param {L.SpectrumSpatial.Services.Service.Options} [options] Additional options of service
*/
L.SpectrumSpatial.Services.MapService = L.SpectrumSpatial.Services.Service.extend(
/** @lends L.SpectrumSpatial.Services.MapService.prototype */
{     
    /**
    * Render options
    * @typedef {Object} L.SpectrumSpatial.Services.MapService.RenderOptions
    * @property {string} mapName Name of map to render
    * @property {string} [imageType=png] Type of image ( png, jpg etc.) 
    * @property {number} width Width of rendered image
    * @property {number} height Height of rendered image
    * @property {Array.<number>} bounds Array of geo bounds for image. [left,top,right,bottom]
    * @property {number} cx Center x coordinate 
    * @property {number} cy Center y coordinate 
    * @property {number} scale Scale
    * @property {number} zoom Zoom
    * @property {string} srs Reference system code
    * @property {number} [resolution] Resolution
    * @property {string} [locale] Locale
    * @property {string} [rd] The type of rendering to perform ( s (speed) or q (quality))
    * @property {string} [bc] The background color to use for the map image (RRGGBB)
    * @property {number} [bo] The opacity of the background color
    * @property {Object} [additionalParams] Additional parameters for post query
    */
    
    /**
    * Legend options
    * @typedef {Object} L.SpectrumSpatial.Services.MapService.LegendOptions
    * @property {string} mapName Name of map for legend 
    * @property {number} width Width of the individual legend swatch in pixels
    * @property {number} height Height of the individual legend swatch in pixels
    * @property {string} [imageType=png] Type of image ( png, jpg etc.)
    * @property {boolean} [inlineSwatch=true] Determines if the swatch images are returned as data or URL to the image location on the server
    * @property {number} [resolution] Resolution
    * @property {string} [locale] Locale
    * @property {Object} [postData] If specified runs post request to render legend
    */
    
    /**
    * Legend's swatch options
    * @typedef {Object} L.SpectrumSpatial.Services.MapService.SwatchOptions
    * @property {string} mapName Name of map for legend 
    * @property {number} legendIndex The legend to get the swatch from in the named map
    * @property {number} rowIndex The swatch location (row) within the legend
    * @property {number} width Width of the individual legend swatch in pixels
    * @property {number} height Height of the individual legend swatch in pixels
    * @property {string} [imageType=png] Type of image ( png, jpg etc.)
    * @property {number} [resolution] Resolution
    * @property {string} [locale] Locale
    */

    /**
    * Lists all named layers which map service contains
    * @param {Request.Callback} callback Callback of the function
    * @param {Object} context Context for callback
    * @param {string} [locale] Locale of response 
    */
    listNamedLayers : function(callback, context, locale){  
        var operation = new L.SpectrumSpatial.Services.Operation('layers.json');
        this._addResolutionAndLocale(operation,null,locale);
        this.startRequest(operation, callback, context);
    },
    
    /**
    * Describes specified layer
    * @param {string} layerName name of layer
    * @param {Request.Callback} callback Callback of the function
    * @param {Object} context Context for callback
    * @param {string} [locale] Locale of response 
    */
    describeNamedLayer : function(layerName, callback, context, locale){  
        var operation = new L.SpectrumSpatial.Services.Operation('layers/'+ this.clearParam(layerName) + '.json');
        this._addResolutionAndLocale(operation,null,locale);
        this.startRequest(operation, callback, context);
    },
    
    /**
    * Describes specified layers
    * @param {Array.<string>} layerNames Array of layer's names
    * @param {Request.Callback} callback Callback of the function
    * @param {Object} context Context for callback
    */
    describeNamedLayers : function(layerNames, callback, context){  
        var operation = new L.SpectrumSpatial.Services.Operation('layers.json', {  paramsSeparator : '&', queryStartCharacter : '?' } );
        
        var layersString = layerNames.join(',');
        operation.options.getParams.q = 'describe';
        if (layersString.length<1000){
            
            operation.options.getParams.layers = layersString;
        } 
        else{
            operation.options.postParams = { 'Layers' : layerNames };
        }
        
        this.startRequest(operation, callback, context);
    },
    
    /**
    * Lists all named maps which map service contains
    * @param {Request.Callback} callback Callback of the function
    * @param {Object} context Context for callback
    * @param {string} [locale] Locale of response 
    */
    listNamedMaps : function(callback, context, locale){  
        var operation = new L.SpectrumSpatial.Services.Operation('maps.json');
        this._addResolutionAndLocale(operation,null,locale);
        this.startRequest(operation, callback, context);
    },
    
    /**
    * Describes specified map
    * @param {string} mapName name of map
    * @param {Request.Callback} callback Callback of the function
    * @param {Object} context Context for callback
    * @param {string} [locale] Locale of response 
    */
    describeNamedMap : function(mapName, callback, context, locale ){  
        var operation = new L.SpectrumSpatial.Services.Operation('maps/'+ this.clearParam(mapName)+ '.json');
        this._addResolutionAndLocale(operation,null,locale);
        this.startRequest(operation, callback, context);
    },
    
    /**
    * Describes specified maps
    * @param {Array.<string>} mapNames Array of map's names
    * @param {Request.Callback} callback Callback of the function
    * @param {Object} context Context for callback
    */
    describeNamedMaps : function(mapNames, callback, context){  
        var operation = new L.SpectrumSpatial.Services.Operation('maps.json', { paramsSeparator : '&', queryStartCharacter : '?' } );
        
        var mapsString = mapNames.join(',');
        if (mapsString.length<1000){
            operation.options.getParams.q = 'describe';
            operation.options.getParams.maps = mapsString;
        } 
        else{
            operation.options.postParams = { 'Maps' : mapNames };
        }
        
        this.startRequest(operation, callback, context);
    },
    
    
    _createRenderOperation:function (options){
       
        var mapName = this.clearParam(options.mapName);
        if (mapName !== ''){
            mapName = '/'+mapName;
        }
        
        if (!options.imageType){
            options.imageType = 'png';
        }
        
        var operation = new L.SpectrumSpatial.Services.Operation('maps'+ mapName+'/image.' + options.imageType , { responseType: 'arraybuffer' } );
        operation.options.getParams.w = options.width;
        operation.options.getParams.h = options.height;
        if (options.bounds){
            operation.options.getParams.b= options.bounds.join(',')+ ',' + options.srs;
        }
        else{
            operation.options.getParams.c= options.cx+ ',' +options.cy + ',' + options.srs;
        }
        
        if (options.scale){
            operation.options.getParams.s = options.scale;
        }
        
        if (options.zoom){
            operation.options.getParams.z = options.zoom;
        }
        
        this._addResolutionAndLocale(operation, options.resolution, options.locale);
        
        if (options.rd){
            operation.options.getParams.rd = options.rd;
        }
        
        if (options.bc){
            operation.options.getParams.bc = options.bc;
        }
        
        if (options.bo){
            operation.options.getParams.bc = options.bc;
        }
        
        if (options.additionalParams){
            operation.options.postParams = options.additionalParams;
        }
        
        return operation;       
    },
 
    _addResolutionAndLocale: function(operation,resolution, locale){
        if (resolution){
            operation.options.getParams.r = resolution;
        }
        
        if (locale){
            operation.options.getParams.l = locale;
        }
    },
    
    /**
    * Runs rendering map 
    * @param {L.SpectrumSpatial.Services.MapService.RenderOptions} options Render options
    * @param {Request.Callback} callback Callback of the function
    * @param {Object} context Context for callback
    */
    renderMap: function(options, callback, context){
        var operation = this._createRenderOperation(options);
        this.startRequest(operation, callback, context);
    },
    
    /**
    * Returns url of image for get request
    * @param {L.SpectrumSpatial.Services.MapService.RenderOptions} options Render options
    * @returns {string}
    */
    getUrlRenderMap: function(options){
        var operation = this._createRenderOperation(options);
        return (this.options.alwaysUseProxy ? this.options.proxyUrl : '') +  this.checkEncodeUrl(this.getUrl(operation));
    },
        
    /**
    * Runs legend request
    * @param {L.SpectrumSpatial.Services.MapService.LegendOptions} options Options for legend
    * @param {Request.Callback} callback Callback of the function
    * @param {Object} context Context for callback
    */
    getLegendForMap: function(options, callback, context){
        if (!options.imageType){
            options.imageType = 'png';
        }
        var operation = new L.SpectrumSpatial.Services.Operation('maps/'+ this.clearParam(options.mapName)+'/legends.json');
        
        operation.options.getParams.w = options.width;
        operation.options.getParams.h = options.height;
        operation.options.getParams.t = options.imageType;
        this._addResolutionAndLocale(operation,options.resolution,options.locale);
        
        // I WANT TO KILL PB DEVELOPERS FOR THIS '?' IN QUERY
        
        if (options.inlineSwatch!== undefined ){
            operation.options.getParams['?inlineSwatch'] = options.inlineSwatch;
        }
        if (options.postData){
            operation.options.postParams = options.postData;
            operation.options.responseType =  'arraybuffer';
        }
        this.startRequest(operation, callback, context);
    },
    
    _createSwatchOperation: function(options){
        if (!options.imageType){
            options.imageType = 'png';
        }
        var operation = new L.SpectrumSpatial.Services.Operation('maps/'+ this.clearParam(options.mapName)+
                                                                '/legends/'+options.legendIndex + 
                                                                 '/rows/' + options.rowIndex + 
                                                                 '/swatch/' + options.width + 'x' + options.height + '.' + options.imageType);
                                                                 
        this._addResolutionAndLocale(operation,options.resolution,options.locale);
        return operation;
    },
    
    /**
    * Runs request for an individual swatch for a layer of a named map
    * @param {L.SpectrumSpatial.Services.MapService.SwatchOptions} options Options for swatch
    * @param {Request.Callback} callback Callback of the function
    * @param {Object} context Context for callback
    */
    getSwatchForLayer: function(options, callback, context){
        this.startRequest( this._createSwatchOperation(options), callback, context);
    },
    
    /**
    * Returns an individual swatch for a layer of a named map
    * @param {L.SpectrumSpatial.Services.MapService.SwatchOptions} options Options for swatch
    * @returns {string}
    */
    getUrlSwatchForLayer: function(options){
        return this.getUrl(this._createSwatchOperation(options));
    }
    
});

L.SpectrumSpatial.Services.mapService = function(url,options){
  return new L.SpectrumSpatial.Services.MapService(url,options);
};
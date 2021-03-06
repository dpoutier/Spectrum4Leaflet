L.SpectrumSpatial.Controls.Layers = L.Control.Layers.extend({
/** @lends L.SpectrumSpatial.Controls.Layers.prototype */ 

    className: 'leaflet-ss-control-layers',
    
    /**
    * Layers control options class
    * @typedef {Object} L.SpectrumSpatial.Controls.Layers.Options
    * @property {string} [maxHeight] Max height of control
    * @property {string} [maxWidth] Max width of control
    * @property {string} [position] Control position in map
    * @property {boolean} [cssOff] If is true, control rednders without css class ( usefull when you draw outside of the map)
    * @property {boolean} [autoZIndex] If true, Zindexes to overlays will be set automaticly 
    * @property {boolean} [zIndexControls] If true zIndex controls is enabled
    * @property {boolean} [opacityControls] If true opacity controls is enabled
    * @property {boolean} [legendControls] If true legend controls is enabled
    * @property {L.SpectrumSpatial.Controls.Legend.Options} [legendOptions] Options for legend (if legend controls is enabled)
    * @property {Object} [legendContainer] DOM element, if we want to draw legend outside of layers control
    * @property {boolean} [inverseOrder=false] If true, upper layer in control is upper on map ( max Z index)
    */
    
    options : {
        zIndexControls:true,
        opacityControls:true,
        legendControls:true,
        legendOptions : {},
        legendContainer :null,
        inverseOrder:false
    },
    
    /**
    * @class Layers control
    * @augments {L.Control} 
    * @constructs L.SpectrumSpatial.Controls.Layers
    * @param {Object} baseLayers Object which contans base layers ( { "title":layer } )
    * @param {Object} overlays Object which contans overlays layers ( { "title":layer } )
    * @param {L.SpectrumSpatial.Controls.Layers.Options} [options] Options
    */
    initialize: function (baseLayers, overlays, options) {
        L.setOptions(this, options);

        this._layers = {};
        if (!this.options.legendOptions){
            this.options.legendOptions = {  };
        }
        if (this.options.legendOptions.cssOff === undefined){
            this.options.legendOptions.cssOff = true;
        }
        this._minZIndex = 1;
        this._maxZIndex = 0;
        
        
        this._handlingClick = false;

        for (var i in baseLayers) {
            this._addLayer(baseLayers[i], i);
        }

        for (i in overlays) {
            this._addLayer(overlays[i], i, true);
        }
    },
    
    /**
    * Adds control to map
    * @memberof L.SpectrumSpatial.Controls.Layers.prototype
    * @param {L.Map} map Map for control
    * @param {Object} [outsideContainer] DOM element, if spicified control will be rendered outside of map
    */
    addTo: function (map, outsideContainer) {
        this.remove();
        this._map = map;

        
        var container = this._container = this.onAdd(map);
        
        if (outsideContainer){
            outsideContainer.appendChild(container);
        }
        else{
            L.DomUtil.addClass(container, 'leaflet-control');
            var pos = this.getPosition();
            var corner = map._controlCorners[pos];

            if (pos.indexOf('bottom') !== -1) {
                corner.insertBefore(container, corner.firstChild);
            } else {
                corner.appendChild(container);
            }   
        }

        return this;
    },
    
    _addLayer: function (layer, name, overlay) {
        layer.on('add remove', this._onLayerChange, this);

        if (overlay && this.options.autoZIndex && layer.setZIndex) {
            this._maxZIndex++;
            layer.setZIndex(this._maxZIndex);
        }
        
        if (overlay && !this.options.autoZIndex){
            if (layer.getZIndex){
                var z = layer.getZIndex();
                if (this._minZIndex>z){
                    this._minZIndex = z;
                }
                if (this._maxZIndex<z){
                    this._maxZIndex = z;
                }
            }
        }
        
        var id = L.stamp(layer);

        this._layers[id] = {
            layer: layer,
            name: name,
            overlay: overlay
        };
    },
    
    _update: function () {
        if (!this._container) { return this; }

        L.DomUtil.empty(this._baseLayersList);
        L.DomUtil.empty(this._overlaysList);

        var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;

        var overlays = [];
        for (i in this._layers) {
            obj = this._layers[i];
            overlaysPresent = overlaysPresent || obj.overlay;
            baseLayersPresent = baseLayersPresent || !obj.overlay;
            baseLayersCount += !obj.overlay ? 1 : 0;
            if (!obj.overlay){
                this._addItem(obj);
            }
            else{
                overlays.push({ lo : obj, z : obj.layer.getZIndex() });
            }      
        }
        
        overlays.sort(L.SpectrumSpatial.Utils.sortByProperty('z',(this.options.inverseOrder)? "desc" :  "asc" ));
        
        for (i in overlays) {
            obj = overlays[i];
            this._addItem(obj.lo);
        }
        
        // Hide base layers section if there's only one layer.
        if (this.options.hideSingleBase) {
            baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
            this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
        }

        this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';

        return this;
    },
    
    
    _initLayout: function () {
        
        var container = this._container = L.DomUtil.create('div', this.options.cssOff ? '' : this.className);

        // makes this work on IE touch devices by stopping it from firing a mouseout event when the touch is released
        container.setAttribute('aria-haspopup', true);

        if (!L.Browser.touch) {
            L.DomEvent
                .disableClickPropagation(container)
                .disableScrollPropagation(container);
        } else {
            L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
        }

        var form = this._form = L.DomUtil.create('form', this.className + '-list');
        
        if (this.options.maxHeight){
	        this._form.style.maxHeight = this.options.maxHeight;
        }
        if (this.options.maxWidth){
	        this._form.style.maxWidth = this.options.maxWidth;
        }

        if (this.options.collapsed) {
            if (!L.Browser.android) {
                L.DomEvent.on(container, {
                    mouseenter: this._expand,
                    mouseleave: this._collapse
                }, this);
            }

            var link = this._layersLink = L.DomUtil.create('a', 'leaflet-control-layers-toggle' , container);
            link.href = '#';
            link.title = 'Layers';

            if (L.Browser.touch) {
                L.DomEvent
                    .on(link, 'click', L.DomEvent.stop)
                    .on(link, 'click', this._expand, this);
            } else {
                L.DomEvent.on(link, 'focus', this._expand, this);
            }

            this._map.on('click', this._collapse, this);
            // TODO keyboard accessibility
        } else {
            this._expand();
        }

        this._baseLayersList = L.DomUtil.create('div', this.className + '-base', form);
        this._separator = L.DomUtil.create('div', this.className + '-separator', form);
        this._overlaysList = L.DomUtil.create('div', this.className + '-overlay', form);

        container.appendChild(form);
    },
    
    // IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
    _createRadioElement: function (name, checked) {

        var radioHtml = '<input type="radio" class="leaflet-ss-cell leaflet-ss-control-layers-selector" name="' +
                name + '"' + (checked ? ' checked="checked"' : '') + '/>';

        var radioFragment = document.createElement('div');
        radioFragment.innerHTML = radioHtml;

        return radioFragment.firstChild;
    },
    
    _addItem: function (obj) {
        var layerItem = L.DomUtil.create('div','leaflet-ss-rowcontainer');
        var row = L.DomUtil.create('div','leaflet-ss-row',layerItem);
        var checked = this._map.hasLayer(obj.layer);
        var input;
        

        if (obj.overlay) {
            input = L.DomUtil.create('input', 'leaflet-ss-cell leaflet-control-layers-selector');
            input.name = 'visibilityInput';
            input.type = 'checkbox';
            input.defaultChecked = checked;
        } else {
            input = this._createRadioElement('visibilityInput', checked);
        }
        input.layerId = L.stamp(obj.layer);
        L.DomEvent.on(input, 'click', this._onVisibilityChanged, this);

        var name = L.DomUtil.create('span','leaflet-ss-cell leaflet-ss-control-layers-title');
        name.innerHTML = ' ' + obj.name;
        
        row.appendChild(input);
        
        if (obj.overlay) {
            
            if (this.options.zIndexControls){
                row.appendChild(this._createZIndexButton('up', obj.layer, input.layerId ));
                row.appendChild(this._createZIndexButton('down', obj.layer, input.layerId ));
            }  
            
            if (this.options.legendControls){
                var legend = L.DomUtil.create('div','leaflet-ss-cell leaflet-ss-control-layers-btn leaflet-ss-control-layers-legend');
                legend.layerId = input.layerId;
                L.DomEvent.on(legend, 'click', this._onLegendClick, this);
                row.appendChild(legend);    
                if (this.options.legendContainer){
                    obj.legendContainer = this.options.legendContainer;
                }
                else{
                    obj.legendContainer = document.createElement('div','leaflet-ss-row');
                    layerItem.appendChild(obj.legendContainer);
                }
            }
            if (this.options.opacityControls){
                var opacity = L.DomUtil.create('input','leaflet-ss-cell leaflet-ss-control-layers-input');
                opacity.type = 'text';
                opacity.name = 'opacityInput';
                opacity.value = (obj.layer.getOpacity)? obj.layer.getOpacity(): this.options.opacity;
                opacity.layerId = L.stamp(obj.layer);
                L.DomEvent.on(opacity, 'input', this._onOpacityChanged, this);
                row.appendChild(opacity);
            }
        }

        row.appendChild(name);
        
        var container = obj.overlay ? this._overlaysList : this._baseLayersList;
        container.appendChild(layerItem);
        
        obj.container = layerItem;
        return layerItem;
    },
    
    _createZIndexButton:function(displayDirection, layer, layerId ){
        var className = 'leaflet-ss-cell leaflet-ss-control-layers-btn leaflet-ss-control-layers-' + displayDirection;
        var realDirection = ((displayDirection === 'up' & this.options.inverseOrder) | 
                             (displayDirection === 'down' & !this.options.inverseOrder)) ? 'up':'down';
        var clickFunction = ( realDirection ==='up' ) ? this._onUpClick : this._onDownClick;
        var disableIndex = ( realDirection ==='up' )?  this._maxZIndex:this._minZIndex;
        var btn = L.DomUtil.create('div', className);
        btn.layerId = layerId;
        L.DomEvent.on(btn, 'click', clickFunction , this);
        if (layer.getZIndex()=== disableIndex){
            L.DomUtil.addClass(btn, 'leaflet-ss-disabled');
        }
        
        return btn;
    },
    
    _onLegendClick: function(e) {
        var layerId = e.currentTarget.layerId;
        var lo = this._layers[layerId];
        var legend;
        if (!this.options.legendContainer) {
            if (lo.legendContainer.hasChildNodes()){
                L.DomUtil.empty(lo.legendContainer);
            }
            else{
                legend = new L.SpectrumSpatial.Controls.Legend(lo.layer._service,lo.layer._mapName,this.options.legendOptions);
                legend.addTo(this._map , this.options.legendContainer ? this.options.legendContainer : lo.legendContainer);             
            }       
        }
        else{           
            legend = new L.SpectrumSpatial.Controls.Legend(lo.layer._service,lo.layer._mapName,this.options.legendOptions);
            legend.addTo(this._map , this.options.legendContainer ? this.options.legendContainer : lo.legendContainer);
        }
    },
    
    _onDownClick: function(e) {
        var layerId = e.currentTarget.layerId;
        var layer = this._layers[layerId].layer;
        var curZ = layer.getZIndex();
        var oldLayer = this._findOverlayByZ(curZ-1);
        if (oldLayer){
            oldLayer.layer.setZIndex(curZ);
            layer.setZIndex(curZ-1);
            this._update();
        }
    },
    
    _onUpClick: function(e) {
        var layerId = e.currentTarget.layerId;
        var layer = this._layers[layerId].layer;
        var curZ = layer.getZIndex();
        var oldLayer = this._findOverlayByZ(curZ+1);
        if (oldLayer){
            oldLayer.layer.setZIndex(curZ);
            layer.setZIndex(curZ+1);
            this._update();
        }
    },
    
    _findOverlayByZ: function(z){   
        for (var i in this._layers) {
            obj = this._layers[i];
            
            if (obj.overlay && obj.layer.getZIndex()===z ){
                return obj;
            } 
        }
        return null;
    },
    
    _onVisibilityChanged: function () {
        var inputs = L.SpectrumSpatial.Utils.getElementsByName(this._container,'visibilityInput');   //document.getElementsByName('visibilityInput'),
        var   input, layer, hasLayer;
        var addedLayers = [],
            removedLayers = [];

        this._handlingClick = true;

        for (var i = 0, len = inputs.length; i < len; i++) {
            input = inputs[i];
            layer = this._layers[input.layerId].layer;
            hasLayer = this._map.hasLayer(layer);

            if (input.checked && !hasLayer) {
                addedLayers.push(layer);

            } else if (!input.checked && hasLayer) {
                removedLayers.push(layer);
            }
        }

        // Bugfix issue 2318: Should remove all old layers before readding new ones
        for (i = 0; i < removedLayers.length; i++) {
            this._map.removeLayer(removedLayers[i]);
        }
        for (i = 0; i < addedLayers.length; i++) {
            this._map.addLayer(addedLayers[i]);
        }

        this._handlingClick = false;

        this._refocusOnMap();
    },
    
    _onOpacityChanged:function(){
        var inputs =L.SpectrumSpatial.Utils.getElementsByName(this._container,'opacityInput'); //document.getElementsByName('opacityInput');
        var input, layer;
        
        this._handlingClick = true;

        for (var i = 0, len = inputs.length; i < len; i++) {
            input = inputs[i];
            layer = this._layers[input.layerId].layer;
            var newOpacity = parseFloat(input.value);
            if (layer.setOpacity && !isNaN(newOpacity) ){
                layer.setOpacity(newOpacity);
            }
        }
        
        this._handlingClick = false;
    },
    
    _expand: function () {
        L.DomUtil.addClass(this._container, this.className + '-expanded');
    },

    _collapse: function () {
        L.DomUtil.removeClass(this._container, this.className + '-expanded');
    }
    
});

L.SpectrumSpatial.Controls.layers = function(baselayers, overlays,options){
    return new L.SpectrumSpatial.Controls.Layers(baselayers, overlays,options);
};
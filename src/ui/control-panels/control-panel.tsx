import React, { useEffect, useState,useRef } from "react";
import { Checkbox } from "./checkbox";
import { TagsFilter } from "./tags";
import { set as lodashSet, cloneDeep } from 'lodash';
import * as d3 from "d3";
import Button from '@mui/material/Button';
import { Tag } from "src/core/tag";

import './control-panel.css'

type PropType = {
  suggestions: Map<string, Tag>;
  forceProperties: any;
  allLinks : boolean;
  tagNodes: boolean;
  onlySelected: boolean;
  showAllLinks: Function;
  showTagNodes: Function;
  showOnlySelectedNodes: Function;
  tagSelectionChanged: Function;
  updateForceProperties: Function;
  resetForces: Function;
};

export function onEngineTick(progress: number) {
  d3.select('#status_value').style('flex-basis', progress + '%');
};

export function onEngineStop() {
  d3.select('#status_value').style('flex-basis', '100%');
  }



export const ControlPanel = (props: PropType) => {
  const handleChange = (attribute: string, value: any) => {
    const updated = cloneDeep(props.forceProperties);
    lodashSet(updated, attribute, value);
    props.updateForceProperties(updated);
  };

  return (
    <div className="Graph__ControlPanel_container">

      <div className='Graph__ControlPanel_control item'>
        <p >
          <label className="item" >Filters</label>
        </p>
        <div>
          <Checkbox
            label="Expand all relationships"
            value={props.allLinks}
            onChange={() => props.showAllLinks(!props.allLinks)}
          />
        </div>
        <div>
          <Checkbox
            label="Show tag nodes"
            value={props.tagNodes}
            onChange={() => props.showTagNodes(!props.tagNodes)}
          />
        </div>
        <div>
          <Checkbox
            label="Show selected nodes only"
            value={props.onlySelected}
            onChange={() => props.showOnlySelectedNodes(!props.onlySelected)}
          />
        </div>
        <div>
          <TagsFilter
            suggestions={props.suggestions}
            tagSelectionChanged={props.tagSelectionChanged}
          />
        </div>
      </div> {/*filter */}

     <div className='Graph__ControlPanel_control' key={props.forceProperties}>
        <div className="item status">
          <p><label>Layout Status</label></p>
          <div className="status_bar_container">
            <div
              className="status_bar"
              onClick={() => props.updateForceProperties(props.forceProperties)}
            >
              <div id="status_value"></div>
              <p></p>
            </div>
          </div>
          <div className='Graph__ControlPanel_buttons'>
            <Button variant="outlined" title="Run" size="small" onClick={() => props.updateForceProperties(props.forceProperties)}>
              <i className="fa fa-play"></i>
            </Button>
            <Button variant="outlined" title="Reset" size="small" onClick={() => props.resetForces()}>
            <i className="fas fa-redo"></i>
            </Button>
          </div>
        </div>
 
        <div className="item layout" id='charge'>
          <p>
              <Checkbox
                label="Charge"
                value={props.forceProperties.charge.enabled}
                onChange={(e: any) => handleChange('charge.enabled', e.target.checked)}
              />
            {/* Attracts (+) or repels (-) nodes to/from each other. */}
          </p>

          <div>
            <label title="Negative strength repels nodes. Positive strength attracts nodes.">
              <output id='charge.strength'>strength : {props.forceProperties.charge.strength}</output>
              <input
                type="range"
                min="-200"
                max="200"
                value={props.forceProperties.charge.strength}
                step="10"
                onChange={(e: any) => handleChange('charge.strength', e.target.value)}
              />
            </label>
          </div>
          <div>
            <label title="Minimum distance at which force is applied.">
              <output id='charge.distanceMin'>distanceMin : {props.forceProperties.charge.distanceMin}</output>
              <input
                type="range"
                min="1"
                max="50"
                value={props.forceProperties.charge.distanceMin}
                step="5"
                onChange={(e: any) => handleChange('charge.distanceMin', e.target.value)}
              />
            </label>
          </div>
          <div>
          <label title="Maximum distance at which the force is applied">
            <output id="charge.distanceMax.value">distanceMax : {props.forceProperties.charge.distanceMax.value < 100 ? 
            props.forceProperties.charge.distanceMax.value :
            props.forceProperties.charge.distanceMax.value.toExponential(0)}</output>
            <input
              type="range"
              min={scale(props.forceProperties.charge.distanceMax.lowerBound)}
              max={scale(props.forceProperties.charge.distanceMax.upperBound)}
              value={scale(props.forceProperties.charge.distanceMax.value)}
              step={props.forceProperties.charge.distanceMax.step}
              onChange={(e: any) => handleChange('charge.distanceMax.value', scale(e.target.value, false))}
            />
          </label>
          </div>
        </div>

        <div className="item layout" id='link'>
     <p>
              <Checkbox
                label="Link"
                value={props.forceProperties.link.enabled}
                onChange={(e: any) => handleChange('link.enabled', e.target.checked)}
              />
            {/* Enable link force. */}
          </p>

          <div>
          <label title="The force will push/pull nodes to make links this long">
            <output id="link.distance">distance : {props.forceProperties.link.distance}</output>
            <input
              type="range"
              min="0"
              max="1000"
              value={props.forceProperties.link.distance}
              step="10"
              onChange={(e: any) => handleChange('link.distance', e.target.value)}
            />
          </label>
          </div>
          <div>
          <label title="Higher values increase rigidity of the links (WARNING: high values are computationally expensive)">
            <output id="link.iterations">iterations : {props.forceProperties.link.iterations}</output>
            <input
              type="range"
              min="1"
              max="10"
              value={props.forceProperties.link.iterations}
              step="1"
              onChange={(e: any) => handleChange('link.iterations', e.target.value)}
            />
          </label>
          </div>
      </div>

        <div className="item layout" id='collide'>
        <p>
              <Checkbox
                label="Collide"
                value={props.forceProperties.collide.enabled}
                onChange={(e: any) => handleChange('collide.enabled', e.target.checked)}
              />
            {/* Prevents nodes from overlapping. */}
          </p>

          <div>
          <label>
            <output id="collide.strength">strength : {props.forceProperties.collide.strength}</output>
            <input
              type="range"
              min="0"
              max="2"
              value={props.forceProperties.collide.strength}
              step="0.1"
              onChange={(e: any) => handleChange('collide.strength', e.target.value)}
            />
          </label>
          </div>

          <div>
          <label title="Size of nodes">
            <output id="collide.radius">radius : {props.forceProperties.collide.radius}</output>
            <input
              type="range"
              min="0"
              max="100"
              value={props.forceProperties.collide.radius}
              step="1"
              onChange={(e: any) => handleChange('collide.radius', e.target.value)}
            />
          </label>
          </div>

          <div>
          <label title="Higher values increase rigidity of the nodes (WARNING: high values are computationally expensive)">
            <output id="collide.iterations">iterations : {props.forceProperties.collide.iterations}</output>
            <input
              type="range"
              min="1"
              max="10"
              value={props.forceProperties.collide.iterations}
              step="1"
              onChange={(e: any) => handleChange('collide.iterations', e.target.value)}
            />
          </label>
          </div>
        </div>

        <div className="item layout" id='center'>
          <p>
              <Checkbox
                label="Center"
                value={props.forceProperties.center.enabled}
                onChange={(e: any) => handleChange('center.enabled', e.target.checked)}
              />
            {/* Move the center of the graph on x and y. */}
          </p>

          <div>
          <label title="x axis translation.">
            <output id="centerX">x : {props.forceProperties.center.x}</output>
            <input
              type="range"
              min="-1"
              max="1"
              value={props.forceProperties.center.x}
              step="0.05"
              onChange={(e: any) => handleChange('center.x', e.target.value)}
            />
          </label>
          </div>
          <div>
          <label title="y axis translation.">
            <output id="centerY">y : {props.forceProperties.center.y}</output>
            <input
              type="range"
              min="-1"
              max="1"
              value={props.forceProperties.center.y}
              step="0.05"
              onChange={(e: any) => handleChange('center.y', e.target.value)}
            />
          </label>
          </div>

        </div> {/* force center */}

      </div>  {/* layout */}

    </div>
  );
};

function scale(value: number, to: boolean = true) {
  return to ? Math.floor(Math.log(value)) : Math.floor(Math.exp(value))
}
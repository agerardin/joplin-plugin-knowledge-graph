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
    
    console.log('before ', updated);
    
    lodashSet(updated, attribute, value);
    props.updateForceProperties(updated);

    console.log('after', updated)
  };

  let charge = props.forceProperties.charge;
  let link = props.forceProperties.link;
  let collide = props.forceProperties.collide;
  let center = props.forceProperties.center;


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
              <output id='charge.strength'>strength : {charge.strength.value}</output>
              <input
                type="range"
                min={charge.strength.min}
                max={charge.strength.max}
                value={charge.strength.value}
                step={charge.strength.step}
                onChange={(e: any) => handleChange('charge.strength.value', e.target.value)}
              />
            </label>
          </div>
          <div>
            <label title="Minimum distance at which force is applied.">
              <output id='charge.distanceMin'>distanceMin : {charge.distanceMin.value}</output>
              <input
                type="range"
                min={charge.distanceMin.min}
                max={charge.distanceMin.max}
                value={charge.distanceMin.value}
                step={charge.distanceMin.step}
                onChange={(e: any) => handleChange('charge.distanceMin.value', e.target.value)}
              />
            </label>
          </div>
          <div>
          <label title="Maximum distance at which the force is applied">
            <output id="charge.distanceMax.value">distanceMax : {charge.distanceMax.value < 100 ? 
            Math.round(charge.distanceMax.value) :
            charge.distanceMax.value.toExponential(0)}</output>
            <input
              type="range"
              min={scale(charge.distanceMax.lowerBound)}
              max={scale(charge.distanceMax.upperBound)}
              value={scale(charge.distanceMax.value)}
              step={charge.distanceMax.step}
              onChange={(e: any) => handleChange('charge.distanceMax.value', scale(e.target.value, false))}
            />
          </label>
          </div>
        </div>

        <div className="item layout" id='link'>
     <p>
              <Checkbox
                label="Link"
                value={link.enabled}
                onChange={(e: any) => handleChange('link.enabled', e.target.checked)}
              />
            {/* Enable link force. */}
          </p>

          <div>
          <label title="The force will push/pull nodes to make links this long">
            <output id="link.distance">distance : {link.distance.value}</output>
            <input
              type="range"
              min={link.distance.min}
              max={link.distance.max}
              value={link.distance.value}
              step={link.distance.step}
              onChange={(e: any) => handleChange('link.distance.value', e.target.value)}
            />
          </label>
          </div>
          <div>
          <label title="Higher values increase rigidity of the links (WARNING: high values are computationally expensive)">
            <output id="link.iterations">iterations : {link.iterations.value}</output>
            <input
              type="range"
              min={link.iterations.min}
              max={link.iterations.max}
              value={link.iterations.value}
              step={link.iterations.step}
              onChange={(e: any) => handleChange('link.iterations.value', e.target.value)}
            />
          </label>
          </div>
      </div>

        <div className="item layout" id='collide'>
        <p>
              <Checkbox
                label="Collide"
                value={collide.enabled}
                onChange={(e: any) => handleChange('collide.enabled', e.target.checked)}
              />
            {/* Prevents nodes from overlapping. */}
          </p>

          <div>
          <label>
            <output id="collide.strength">strength : {collide.strength.value}</output>
            <input
              type="range"
              min={collide.strength.min}
              max={collide.strength.max}
              value={collide.strength.value}
              step={collide.strength.step}
              onChange={(e: any) => handleChange('collide.strength.value', e.target.value)}
            />
          </label>
          </div>

          <div>
          <label title="Size of nodes">
            <output id="collide.radius">radius : {collide.radius.value}</output>
            <input
              type="range"
              min={collide.radius.min}
              max={collide.radius.max}
              value={collide.radius.value}
              step={collide.radius.step}
              onChange={(e: any) => handleChange('collide.radius.value', e.target.value)}
            />
          </label>
          </div>

          <div>
          <label title="Higher values increase rigidity of the nodes (WARNING: high values are computationally expensive)">
            <output id="collide.iterations">iterations : {collide.iterations.value}</output>
            <input
              type="range"
              min={collide.iterations.min}
              max={collide.iterations.max}
              value={collide.iterations.value}
              step={collide.iterations.step}
              onChange={(e: any) => handleChange('collide.iterations.value', e.target.value)}
            />
          </label>
          </div>
        </div>

        <div className="item layout" id='center'>
          <p>
              <Checkbox
                label="Center"
                value={center.enabled}
                onChange={(e: any) => handleChange('center.enabled', e.target.checked)}
              />
            {/* Move the center of the graph on x and y. */}
          </p>

          <div>
          <label title="x axis translation.">
            <output id="centerX">x : {center.x.value}</output>
            <input
              type="range"
              min={center.x.min}
              max={center.x.max}
              value={center.x.value}
              step={center.x.step}
              onChange={(e: any) => handleChange('center.x.value', e.target.value)}
            />
          </label>
          </div>
          <div>
          <label title="y axis translation.">
            <output id="centerY">y : {center.y.value}</output>
            <input
              type="range"
              min={center.y.min}
              max={center.y.max}
              value={center.y.value}
              step={center.y.step}
              onChange={(e: any) => handleChange('center.y.value', e.target.value)}
            />
          </label>
          </div>

        </div> {/* force center */}

      </div>  {/* layout */}

    </div>
  );
};

function scale(value: number, to: boolean = true) {
  return to ? Math.log(value) : Math.exp(value)
}
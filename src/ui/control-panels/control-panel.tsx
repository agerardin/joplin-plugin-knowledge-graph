import React, { useEffect, useState } from "react";
import { Checkbox } from "./checkbox";
import { TagsFilter } from "./tags";
import { TagIndex } from "../model";
import { set } from 'lodash';
import * as d3 from "d3";

type PropType = {
  suggestions: Map<string, TagIndex>;
  forceProperties: {};
  showAllLinks: Function;
  showTagNodes: Function;
  showOnlySelectedNodes: Function;
  tagSelectionChanged: Function;
  updateForces: Function;
};


export function onEngineTick(tick: number, maxTicks: number) {
  d3.select('#status_value').style('flex-basis', (tick *100 / maxTicks) + '%');
};

export function onEngineStop() {
  d3.select('#status_value').style('flex-basis', '100%');
  }



export const ControlPanel = (props: PropType) => {
  const [showAllLinks, setShowAllLinks] = useState(true);
  const [hideTagNodes, setHideTagNodes] = useState(true);
  const [showOnlySelectedNodes, setShowOnlySelectedNodes] = useState(false);
  const [forceProperties, setForceProperties] = useState(props.forceProperties);

  useEffect(() => {
    props.showAllLinks(showAllLinks);
  }, [showAllLinks]);

  useEffect(() => {
    props.showTagNodes(hideTagNodes);
  }, [hideTagNodes]);

  useEffect(() => {
    props.showOnlySelectedNodes(showOnlySelectedNodes);
  }, [showOnlySelectedNodes]);

  useEffect(() => {
    if (forceProperties === props.forceProperties) {
      return;
    }
    props.updateForces(forceProperties);
  }, [forceProperties]);

  const handleChange = (attribute: string, value: any) => {
    // need a brand new copy to trigger an update
    const updated = Object.assign({}, forceProperties);
    set(updated, attribute, value);
    setForceProperties(updated);
  };

  return (
    <div className='controls'>
      <div className='filters'>
        <div className='filter'>
          <Checkbox
            label="Expand all relationships"
            value={showAllLinks}
            onChange={() => setShowAllLinks(!showAllLinks)}
          />
        </div>
        <div className='filter'>
          <Checkbox
            label="Show tag nodes"
            value={hideTagNodes}
            onChange={() => setHideTagNodes(!hideTagNodes)}
          />
        </div>
        <div className='filter'>
          <Checkbox
            label="Show selected nodes only"
            value={showOnlySelectedNodes}
            onChange={() => setShowOnlySelectedNodes(!showOnlySelectedNodes)}
          />
        </div>
        <div className='filter'>
          <TagsFilter
            suggestions={props.suggestions}
            tagSelectionChanged={props.tagSelectionChanged}
          />
        </div>
      </div>

      <div className="layout">
        <div className="force status">
          <p>
            <label>Status</label> Click on status bar to restart layout
          </p>
          <div
            className="status_bar"
            onClick={() => props.updateForces(forceProperties)}
          >
            <div id="status_value"></div>
          </div>
        </div>

        <div className="force" id='center'>
          <p>
              <Checkbox
                label="Center"
                value={forceProperties.center.enabled}
                onChange={(e: any) => handleChange('center.enabled', e.target.checked)}
              />
            Move the center of the graph on x and y.
          </p>

          <div>
          <label>
            <output id="centerX">x {forceProperties.center.x}</output>
            <input
              type="range"
              min="-1"
              max="1"
              value={forceProperties.center.x}
              step="0.05"
              onChange={(e: any) => handleChange('center.x', e.target.value)}
            />
          </label>
          </div>
          <div>
          <label>
            <output id="centerY">y {forceProperties.center.y}</output>
            <input
              type="range"
              min="-1"
              max="1"
              value={forceProperties.center.y}
              step="0.05"
              onChange={(e: any) => handleChange('center.y', e.target.value)}
            />
          </label>
          </div>

        </div>

        <div className="force" id='charge'>
          <p>
              <Checkbox
                label="Charge"
                value={forceProperties.charge.enabled}
                onChange={(e: any) => handleChange('charge.enabled', e.target.checked)}
              />
            Attracts (+) or repels (-) nodes to/from each other.
          </p>

          <div>
            <label title="Negative strength repels nodes. Positive strength attracts nodes.">
              <output id='charge.strength'>strength {forceProperties.charge.strength}</output>
              <input
                type="range"
                min="-200"
                max="200"
                value={forceProperties.charge.strength}
                step="10"
                onChange={(e: any) => handleChange('charge.strength', e.target.value)}
              />
            </label>
          </div>
          <div>
            <label title="Minimum distance where force is applied.">
              <output id='charge.distanceMin'>distanceMin  {forceProperties.charge.distanceMin}</output>
              <input
                type="range"
                min="0"
                max="50"
                value={forceProperties.charge.distanceMin}
                step="5"
                onChange={(e: any) => handleChange('charge.distanceMin', e.target.value)}
              />
            </label>
          </div>
          <div>
          <label title="Maximum distance where force is applied">
            <output id="charge.distanceMax">distanceMax  {forceProperties.charge.distanceMax}</output>
            <input
              type="range"
              min={forceProperties.charge.distanceMaxLowerBound}
              max={forceProperties.charge.distanceMaxUpperBound}
              value={forceProperties.charge.distanceMax}
              step={forceProperties.charge.step}
              onChange={(e: any) => handleChange('charge.distanceMax', e.target.value)}
            />
          </label>
          </div>
        </div>

        <div className="force" id='link'>
     <p>
              <Checkbox
                label="Link"
                value={forceProperties.link.enabled}
                onChange={(e: any) => handleChange('link.enabled', e.target.checked)}
              />
            Enable link force.
          </p>

          <div>
          <label title="The force will push/pull nodes to make links this long">
            <output id="link.distance">distance {forceProperties.link.distance}</output>
            <input
              type="range"
              min="0"
              max="100"
              value={forceProperties.link.distance}
              step="1"
              onChange={(e: any) => handleChange('link.distance', e.target.value)}
            />
          </label>
          </div>
          <div>
          <label title="Higher values increase rigidity of the links (WARNING: high values are computationally expensive)">
            <output id="link.iterations">iterations {forceProperties.link.iterations}</output>
            <input
              type="range"
              min="1"
              max="10"
              value={forceProperties.link.iterations}
              step="1"
              onChange={(e: any) => handleChange('link.iterations', e.target.value)}
            />
          </label>
          </div>
      </div>

        <div className="force" id='collide'>
        <p>
              <Checkbox
                label="Collide"
                value={forceProperties.collide.enabled}
                onChange={(e: any) => handleChange('collide.enabled', e.target.checked)}
              />
            Prevents nodes from overlapping.
          </p>

          <div>
          <label>
            <output id="collide.strength">strength {forceProperties.collide.strength}</output>
            <input
              type="range"
              min="0"
              max="2"
              value={forceProperties.collide.strength}
              step="0.1"
              onChange={(e: any) => handleChange('collide.strength', e.target.value)}
            />
          </label>
          </div>

          <div>
          <label title="Size of nodes">
            <output id="collide.radius">radius {forceProperties.collide.radius}</output>
            <input
              type="range"
              min="0"
              max="100"
              value={forceProperties.collide.radius}
              step="1"
              onChange={(e: any) => handleChange('collide.radius', e.target.value)}
            />
          </label>
          </div>

          <div>
          <label title="Higher values increase rigidity of the nodes (WARNING: high values are computationally expensive)">
            <output id="collide.iterations">iterations {forceProperties.collide.iterations}</output>
            <input
              type="range"
              min="0"
              max="10"
              value={forceProperties.collide.iterations}
              step="1"
              onChange={(e: any) => handleChange('collide.iterations', e.target.value)}
            />
          </label>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, {useState, useEffect, useRef} from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import { Tag } from 'src/core/tag';

import './tags.css'

type PropType = 
{
  suggestions: Map<string, Tag>,
  tagSelectionChanged : Function
}

const KeyCodes = {
  comma: 188,
  enter: 13
};
const delimiters = [KeyCodes.comma, KeyCodes.enter];

export const TagsFilter = (props : PropType) => {

  let suggestions = Array.from(props.suggestions.values()).map((tag : Tag) => {
    return {
      id: tag.label,
      text: `${tag.label} (${tag.nodeIds.length})`,
    };
  });

  const [tags, setTags] = useState([]);

  const handleDelete = (i : number) => {
    const updatedState = tags.filter((_ : any, index : number) => index !== i);
    setTags(updatedState);
    props.tagSelectionChanged(updatedState);
  };

  const handleAddition = (tag : any) => {
    if(!props.suggestions.has(tag.id)) {
      return;
    }
    const updatedState = [...tags, tag];
    setTags(updatedState);
    props.tagSelectionChanged(updatedState);
  };

  const handleDrag = (tag, currPos, newPos) => {
    const newTags = tags.slice();
    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);
    setTags(newTags);
  };

  const onClearAll = () => {
    setTags([]);
    props.tagSelectionChanged([]);
  }

  return (
        <ReactTags
          tags={tags} //selected tags
          suggestions={suggestions} // all possible tags 
          delimiters={delimiters} // keystroke to select tag
          handleDelete={handleDelete}
          handleAddition={handleAddition}
          handleDrag={handleDrag}
          onClearAll={onClearAll}
          inputFieldPosition="top"
          clearAll={true}
          autocomplete={true}
          placeholder='Filter by tags...'
        />
  );
};
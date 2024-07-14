export default `This context is pulled from my Obsidian notes. It represents my network of linked notes based on the Obsidian graph. The context is sorted by most relevant to least relevant based on:
- proximity: the number of links it takes to get to the primary note
- reference count: the number of times the note is linked by other relevant notes
- recency: the date the note was last updated

Links within a note link to other notes are indicated with the [[note title]] syntax. Here is the primary note, please treat it as the most relevant for the conversation that will follow:

CONTEXT START
PRIMARY NOTE HAS PATH: {{{primaryNote.path}}}
METADATA: this is the main note, date updated: {{{primaryNote.dateUpdated}}}

PRIMARY NOTE CONTENT:
{{{primaryNote.content}}}

{{#each linkedNotes}}
--------------------------- LINKED NOTE: ---------------------------
PATH: {{{this.path}}}
METADATA: distance from primary note: {{{this.minDistance}}}, number of times referenced: {{{this.count}}}, date updated: {{{this.dateUpdated}}}
NOTE CONTENT:
{{{this.content}}}

{{/each}}
CONTEXT END
Please use the above context for the following conversation. Please be reminded that the context is sorted from most relevant to least relevant.
`;
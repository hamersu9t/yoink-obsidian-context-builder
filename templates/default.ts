export default `This context is pulled from my Obsidian notes. It represents my network of linked notes based on the Obsidian graph. The context is sorted by most relevant to least relevant based on the proximity to the main note, the number of times it was referenced via a link, and the date it was last updated. Links within a note link to other notes are indicated with the [[note title]] syntax. Here is the primary note, please treat it as the most relevant for the conversation that will follow:

CONTEXT START
PRIMARY NOTE HAS PATH: {{{primaryNote.path}}}
METADATA: this is the main note, number of times referenced: {{{primaryNote.count}}}, date updated: {{{primaryNote.dateUpdated}}}

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
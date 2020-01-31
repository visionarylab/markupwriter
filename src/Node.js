const { multiplyString } = require('./utils');
const NodeType = require('./enums/NodeType');

let htmlTextOutput = [];
let unclosedTags = 0;

class Node {
  children = [];

  constructor(value, nodeType) {
    this.value = value;
    this.valueArray = value.split('');
    this.nodeType = nodeType;
  }

  addChildren(node) {
    this.children.push(node);
  }

  /**
   * Updates array with new character / string
   * @param {string} valueToPush - character / string to be added to builded array
   */
  updateOutput(valueToPush) {
    if (unclosedTags === 0) {
      htmlTextOutput.push(valueToPush);

      return htmlTextOutput.length - 1;
    } else {
      const indexToPushAt = htmlTextOutput.length - unclosedTags * 2;
      htmlTextOutput.splice(indexToPushAt, 0, valueToPush);

      return indexToPushAt;
    }
  }

  addCharacter(character) {
    const { charInterval } = Node.config;

    return new Promise(resolve =>
      setTimeout(async () => {
        const indexOfNewElement = this.updateOutput(character);
        resolve(indexOfNewElement);
      }, charInterval)
    );
  }

  /**
   * Builds current Node and all children recursively
   * @param {funcion} callback - function called when there is a change in the generated output
   */
  async buildWithChildren(callback) {
    await this.build(callback);

    for (const child of this.children) {
      unclosedTags++;
      await child.buildWithChildren(callback);
      unclosedTags--;
    }
  }

  /**
   * Builds current Node
   * @param {function} callback - function called when there is a change in the generated output
   */
  async build(callback) {
    return new Promise(async resolve => {
      let closingTag = false;
      let newLineRequest = false;
      let charsInCurrentLine = 0;

      let currentCharacter;

      let intent = multiplyString('    ', unclosedTags);

      await this.addCharacter(intent);

      for (let i = 0; i < this.valueArray.length; i++) {
        if (closingTag) {
          // Next character will be composed of necessary intent and closing tag
          currentCharacter = intent + this.value.slice(i);

          // Add new line first
          await this.addCharacter('\r\n');
        } else currentCharacter = this.valueArray[i];

        if (newLineRequest && currentCharacter === ' ') {
          newLineRequest = false;
          charsInCurrentLine = 0;

          currentCharacter =
            currentCharacter + '\r\n' + multiplyString('    ', unclosedTags);
        }

        const indexOfNewElement = await this.addCharacter(currentCharacter);

        callback(htmlTextOutput, indexOfNewElement);

        if (closingTag) break;

        if (currentCharacter === '>') closingTag = true;

        // New lines handling for blocks of text
        if (this.nodeType === NodeType.TEXT_NODE) {
          if (charsInCurrentLine > Node.config.charactersPerTextLine) {
            newLineRequest = true;
          } else {
            charsInCurrentLine++;
          }
        }
      }

      this.addCharacter('\r\n');

      resolve();
    });
  }
}

module.exports = Node;

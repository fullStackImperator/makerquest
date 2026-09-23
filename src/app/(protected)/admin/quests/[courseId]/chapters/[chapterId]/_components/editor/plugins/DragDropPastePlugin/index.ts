"use client"
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { COMMAND_PRIORITY_LOW } from 'lexical';
import { useEffect } from 'react';

import { INSERT_IMAGE_COMMAND } from '../ImagePlugin';
import Compressor from 'compressorjs';
import { getImageDimensions } from '../../nodes/utils';
import { toast } from 'sonner';
import { compressImage, useEditorVariant } from '../../context/EditorVariantContext';

const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
];

export default function DragDropPaste(): null {
  const [editor] = useLexicalComposerContext();
  const { uploadImage } = useEditorVariant();
  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x),
          );
          for (const { file, result } of filesResult) {
            if (uploadImage && isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              try {
                const src = await uploadImage(await compressImage(file));
                const dimensions = await getImageDimensions(src);
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                  src,
                  altText: file.name.replace(/\.[^/.]+$/, ""),
                  showCaption: true,
                  ...dimensions,
                });
              } catch {
                toast.error('Bild konnte nicht hochgeladen werden');
              }
              continue;
            }
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              new Compressor(file, {
                quality: 0.6,
                success(result) {
                  const reader = new FileReader();
                  reader.readAsDataURL(result);
                  reader.onloadend = async () => {
                    if (typeof reader.result !== 'string') {
                      return;
                    }
                    const dimensions = await getImageDimensions(reader.result);
                    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                      src: reader.result,
                      altText: file.name.replace(/\.[^/.]+$/, ""),
                      showCaption: true,
                      ...dimensions,
                    });
                  };
                },
                error(err) {
                  console.log(err.message);
                  getImageDimensions(result).then((dimensions) => {
                    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                      src: result,
                      altText: file.name.replace(/\.[^/.]+$/, ""),
                      showCaption: true,
                      ...dimensions,
                    });
                  });
                }
              });
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, uploadImage]);
  return null;
}
import { Preview } from '@/components/quillEditor/previewQuill'
import React from 'react'

interface DescriptionProps {
  description: string 
}


export const Description = ({ description }: DescriptionProps) => {
  return (
    <section className="w-full flex justify-center py-10">
      <div className="w-10/12 md:w-8/12">
        <h3 className="text-lg md:text-2xl font-semibold mb-3">
          Worum geht es
        </h3>

        <h5 className="text-sm md:text-lg ">
          <Preview value={description} />
        </h5>
      </div>
    </section>
  )
}



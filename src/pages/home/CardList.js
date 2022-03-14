import React, { useState } from 'react'
import { Loading } from '../../components/Loading/Loading'
import Card from '../../components/Card'

const CardList = (props) => {
  const [loadingFlag, setLoadingFlag] = useState(false)

  if (loadingFlag) {
    return <Loading />
  }

  return (
    <div className='pt-16 mx-auto text-gray-600 body-font w-full '>
      <div className='flex flex-wrap -m-4'>
        {props.nfts.map((item, index) => {
          return (
            <Card
              item={item}
              key={item.edition}
              loadingFlag={loadingFlag}
              setLoadingFlag={setLoadingFlag}
            />
          )
        })}
      </div>
    </div>
  )
}

export default CardList

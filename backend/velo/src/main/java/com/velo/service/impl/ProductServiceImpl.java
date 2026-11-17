package com.velo.service.impl;

import com.velo.entity.ProductEntity;
import com.velo.repository.ProductRepository;
import com.velo.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Override
    public ProductEntity createProduct(ProductEntity productEntity) {
        return productRepository.save(productEntity);
    }

    @Override
    public List<ProductEntity> findAllProduct() {
        return productRepository.findAll();
    }

    @Override
    public List<ProductEntity> findAllByBrand(String Brand) {
        return productRepository.findAllByBrand(Brand);
    }


}

import Disabled from '../models/Disabled';

export const insertDisabled = (gid: BigInt) => Disabled.create({
  gid: gid.toString(),
});

export const getDisabled = (gid: BigInt) => Disabled.findOne({
  where: {
    gid: gid.toString(),
  },
});

export const deleteDisabled = (gid: BigInt) => Disabled.destroy({
  where: {
    gid: gid.toString(),
  }
});

export const getAllDisbled = () => Disabled.findAll();
